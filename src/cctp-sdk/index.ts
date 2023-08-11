import { ethers } from "ethers";
import { jetch, poll } from "./helper";
import { CIRCLE_API, GELATO_API, CHAIN } from "./constants";
import {
  CallWithSyncFeeERC2771Request,
  CallWithSyncFeeRequest,
  RelayResponse,
  GelatoRelay,
} from "@gelatonetwork/relay-sdk";
import ForwarderAbi from "./abi/Forwarder.json";
import EIP3009Abi from "./abi/EIP3009.json";

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

export const transfer = async (
  amount: bigint,
  srcMaxFee: bigint,
  dstMaxFee: bigint,
  dstChainId: number,
  signer: ethers.Wallet
): Promise<void> => {
  if (srcMaxFee + dstMaxFee > amount)
    throw new Error("Max fee amount exceeds total amount");

  const srcChainId = await signer.getChainId();

  if (srcChainId === dstChainId)
    throw new Error("Source and destination chain must be different");

  const srcChain = CHAIN[srcChainId];
  const dstChain = CHAIN[dstChainId];

  if (!srcChain || !dstChain) throw new Error("Unsupported chain");

  const depositAuthorization = await buildReceiveWithAuthorization(
    signer,
    srcChain.usdc,
    amount,
    srcChain.forwarder,
    srcChainId,
    "0x9b94f9a1"
  );

  const withdrawAuthorization = await buildReceiveWithAuthorization(
    signer,
    dstChain.usdc,
    dstMaxFee,
    dstChain.forwarder,
    dstChainId,
    "0xd0f48715"
  );

  const relay = new GelatoRelay();
  const forwarder = new ethers.utils.Interface(ForwarderAbi);

  const deposit = forwarder.encodeFunctionData("deposit", [
    srcMaxFee,
    dstChain.domain,
    depositAuthorization,
  ]);

  const tx = await relayAndWait(
    relay,
    srcChain.forwarder,
    deposit,
    srcChainId,
    srcChain.usdc,
    signer
  );

  const receipt = await poll(
    () => signer.provider.getTransactionReceipt(tx),
    (receipt) => receipt !== null,
    1000
  );

  const topic = ethers.utils.solidityKeccak256(
    ["string"],
    ["MessageSent(bytes)"]
  );

  const log = receipt.logs.find((x) => x.topics[0] === topic);
  if (!log) throw new Error("Failed to find message event");

  const [messageBytes] = ethers.utils.defaultAbiCoder.decode(
    ["bytes"],
    log.data
  );

  const messageHash = ethers.utils.keccak256(messageBytes);

  const { attestation } = await poll<AttestationStatus>(
    () => jetch(`${CIRCLE_API}/attestations/${messageHash}`),
    ({ status }) => status === AttestationState.Complete,
    30000
  );

  const withdraw = forwarder.encodeFunctionData("withdraw", [
    messageBytes,
    attestation,
    withdrawAuthorization,
  ]);

  await relayAndWait(
    relay,
    dstChain.forwarder,
    withdraw,
    dstChainId,
    dstChain.usdc
  );
};

const buildReceiveWithAuthorization = async (
  signer: ethers.Wallet,
  token: string,
  value: bigint,
  to: string,
  chainId: number,
  selector: string
): Promise<string> => {
  const domain: ethers.TypedDataDomain = {
    name: "USD Coin",
    version: "2",
    chainId: chainId,
    verifyingContract: token,
  };

  const types = {
    ReceiveWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  if (selector.length !== 10) throw new Error("Invalid function selector");

  const selectorArr = Uint8Array.from(
    Buffer.from(selector.substring(2), "hex")
  );
  const saltArr = ethers.utils.randomBytes(28);
  const nonce = new Uint8Array([...selectorArr, ...saltArr]);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 60;

  const args = {
    from: signer.address,
    to: to,
    value: value,
    validAfter: 0,
    validBefore: deadline,
    nonce: nonce,
  };

  const sig = await signer._signTypedData(domain, types, args);
  const { v, r, s } = ethers.utils.splitSignature(sig);

  const eip3009 = new ethers.utils.Interface(EIP3009Abi);

  const data = eip3009.encodeFunctionData("receiveWithAuthorization", [
    ...Object.values(args),
    v,
    r,
    s,
  ]);

  return "0x" + data.substring(10);
};

const relayAndWait = async (
  relay: GelatoRelay,
  target: string,
  data: string,
  chainId: number,
  feeToken: string,
  signer?: ethers.Wallet
): Promise<string> => {
  const { taskId } = await (signer
    ? callWithSyncFeeERC2771(signer, relay, target, data, chainId, feeToken)
    : callWithSyncFee(relay, target, data, chainId, feeToken));

  const { task } = await poll<TaskStatus>(
    () => jetch(GELATO_API + "/tasks/status/" + taskId),
    ({ task }) =>
      task.taskState === TaskState.Success ||
      task.taskState === TaskState.Cancelled,
    1000
  );

  return task.transactionHash;
};

const callWithSyncFee = (
  relay: GelatoRelay,
  target: string,
  data: string,
  chainId: number,
  feeToken: string
): Promise<RelayResponse> => {
  const request: CallWithSyncFeeRequest = {
    chainId,
    target,
    data,
    feeToken,
    isRelayContext: true,
  };

  return relay.callWithSyncFee(request, {
    retries: 0,
  });
};

const callWithSyncFeeERC2771 = (
  signer: ethers.Wallet,
  relay: GelatoRelay,
  target: string,
  data: string,
  chainId: number,
  feeToken: string
): Promise<RelayResponse> => {
  const request: CallWithSyncFeeERC2771Request = {
    chainId,
    target,
    data,
    feeToken,
    user: signer.address,
    isRelayContext: true,
  };

  return relay.callWithSyncFeeERC2771(request, signer, {
    retries: 0,
  });
};
