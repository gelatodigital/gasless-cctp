import { ethers, deployments } from "hardhat";
import { signPermit } from "../src/signature";
import { jetch, poll } from "../src/helper";
import { GelatoRelay, SponsoredCallRequest } from "@gelatonetwork/relay-sdk";
import {
  ERC20Permit,
  ITokenMessenger,
  IMessageTransmitter,
  PermitForwarder,
} from "../typechain";

enum TaskState {
  Success = "ExecSuccess",
  Cancelled = "Cancelled",
}

enum AttestationState {
  Pending = "pending",
  Complete = "complete",
}

interface TaskStatus {
  task: {
    taskState: TaskState;
    transactionHash: string;
  };
}

interface AttestationStatus {
  status: AttestationState;
  attestation: string;
}

interface ChainType {
  domain: number;
  chainId: number;
  tokenMessenger: string;
  messageTransmitter: string;
  usdc: string;
}

interface BridgeType {
  src: ChainType;
  dst: ChainType;
}

const chains: { [name: string]: ChainType } = {
  ethereum: {
    domain: 0,
    chainId: 5,
    tokenMessenger: "0xd0c3da58f55358142b8d3e06c1c30c5c6114efe8",
    messageTransmitter: "0x26413e8157cd32011e726065a5462e97dd4d03d9",
    usdc: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
  },
  arbitrum: {
    domain: 3,
    chainId: 421613,
    tokenMessenger: "0x12dcfd3fe2e9eac2859fd1ed86d2ab8c5a2f9352",
    messageTransmitter: "0x109bc137cb64eab7c0b1dddd1edf341467dc2d35",
    usdc: "0xfd064a18f3bf249cf1f87fc203e90d8f650f2d63",
  },
};

const bridge: BridgeType = {
  src: chains.ethereum,
  dst: chains.arbitrum,
};

const GELATO_API = "https://api.gelato.digital";
const CIRCLE_API = "https://iris-api-sandbox.circle.com";

const addressToBytes32 = (address: string) =>
  "0x" + address.substring(2).padStart(64, "0");

const main = async () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const SPONSOR_KEY = process.env.SPONSOR_KEY;

  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");
  if (!SPONSOR_KEY) throw new Error("SPONSOR_KEY missing in .env");

  const provider = ethers.provider;
  const wallet = new ethers.Wallet(PRIVATE_KEY); // NOTE: No RPC provider, cannot transact

  const { address: forwarderAddress } = await deployments.get(
    "PermitForwarder"
  );

  const forwarder = (await ethers.getContractAt(
    "PermitForwarder",
    forwarderAddress
  )) as PermitForwarder;

  const tokenMessenger = (await ethers.getContractAt(
    "ITokenMessenger",
    bridge.src.tokenMessenger
  )) as ITokenMessenger;

  const messageTransmitter = (await ethers.getContractAt(
    "IMessageTransmitter",
    bridge.dst.messageTransmitter
  )) as IMessageTransmitter;

  const usdc = (await ethers.getContractAt(
    "ERC20Permit",
    bridge.src.usdc
  )) as ERC20Permit;

  const deadline = Math.floor(Date.now() / 1000) + 60 * 5;
  const amount = ethers.utils.parseUnits("10", 6);

  const sig = await signPermit(
    wallet,
    usdc,
    amount.toBigInt(),
    forwarder.address,
    deadline,
    bridge.src.chainId
  );

  if (!sig) throw new Error("Failed to sign permit");
  const { v, r, s } = sig;

  const depositForBurn =
    await tokenMessenger.populateTransaction.depositForBurn(
      amount,
      bridge.dst.domain,
      addressToBytes32(wallet.address),
      usdc.address
    );

  if (!depositForBurn.data) throw new Error("Invalid calldata");

  const forward = await forwarder.populateTransaction.forward(
    tokenMessenger.address,
    depositForBurn.data,
    usdc.address,
    wallet.address,
    amount,
    deadline,
    v,
    r,
    s
  );

  if (!forward.data) throw new Error("Invalid calldata");

  const relay = new GelatoRelay();

  const srcRequest: SponsoredCallRequest = {
    chainId: bridge.src.chainId,
    target: forwarder.address,
    data: forward.data,
  };

  console.log("Relaying depositForBurn...");

  const srcResult = await relay.sponsoredCall(srcRequest, SPONSOR_KEY, {
    retries: 0,
  });

  const srcTask = await poll<TaskStatus>(
    () => jetch(GELATO_API + "/tasks/status/" + srcResult.taskId),
    ({ task }) =>
      task.taskState === TaskState.Success ||
      task.taskState === TaskState.Cancelled,
    1000
  );

  console.log("Executed depositForBurn:", srcTask.task.transactionHash);

  const receipt = await provider.getTransactionReceipt(
    srcTask.task.transactionHash
  );
  if (!receipt) throw new Error("Failed to find transaction");

  const topic = ethers.utils.solidityKeccak256(
    ["string"],
    ["MessageSent(bytes)"]
  );
  const log = receipt.logs.find((x) => x.topics[0] === topic);

  if (!log) throw new Error("Failed to find event log");

  const messageBytes = ethers.utils.defaultAbiCoder.decode(
    ["bytes"],
    log.data
  )[0];
  const messageHash = ethers.utils.keccak256(messageBytes);

  console.log("Waiting for attestation signature...");

  const { attestation } = await poll<AttestationStatus>(
    () => jetch(`${CIRCLE_API}/attestations/${messageHash}`),
    ({ status }) => status === AttestationState.Complete,
    5000
  );

  console.log(
    `Fetched attestation signature: ${attestation.substring(0, 18)}...`
  );

  const receiveMessage =
    await messageTransmitter.populateTransaction.receiveMessage(
      messageBytes,
      attestation
    );

  if (!receiveMessage.data) throw new Error("Invalid calldata");

  const dstRequest: SponsoredCallRequest = {
    chainId: bridge.dst.chainId,
    target: messageTransmitter.address,
    data: receiveMessage.data,
  };

  console.log("Relaying receiveMessage...");

  const dstResult = await relay.sponsoredCall(dstRequest, SPONSOR_KEY, {
    retries: 0,
  });

  const dstTask = await poll<TaskStatus>(
    () => jetch(GELATO_API + "/tasks/status/" + dstResult.taskId),
    ({ task }) =>
      task.taskState === TaskState.Success ||
      task.taskState === TaskState.Cancelled,
    1000
  );

  console.log("Executed receiveMessage:", dstTask.task.transactionHash);
  console.log(
    `Sucessfully cross-chain transferred ${ethers.utils.formatUnits(
      amount,
      6
    )} USDC`
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
