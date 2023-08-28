import { ethers } from "ethers";
import { jetch, poll } from "./helper";
import { CIRCLE_API, GELATO_API, CHAIN } from "./constants";
import {
  CallWithSyncFeeERC2771Request,
  CallWithSyncFeeRequest,
  RelayResponse,
  GelatoRelay,
} from "@gelatonetwork/relay-sdk";
import SenderAbi from "./abi/GelatoCCTPSender.json";
import ReceiverAbi from "./abi/GelatoCCTPReceiver.json";

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

interface Authorization {
  validAfter: number;
  validBefore: number;
  nonce: Uint8Array;
  v: number;
  r: string;
  s: string;
}

export const transfer = async (
  amount: bigint,
  srcMaxFee: bigint,
  dstMaxFee: bigint,
  dstChainId: bigint,
  signer: ethers.Wallet
): Promise<void> => {
  if (srcMaxFee + dstMaxFee > amount)
    throw new Error("Max fee amount exceeds total amount");

  const provider = signer.provider;
  if (!provider) throw new Error("Signer missing provider");

  const { chainId: srcChainId } = await provider.getNetwork();
  if (srcChainId === dstChainId)
    throw new Error("Source and destination chain must be different");

  const srcChain = CHAIN[srcChainId.toString()];
  const dstChain = CHAIN[dstChainId.toString()];

  if (!srcChain || !dstChain) throw new Error("Unsupported chain");

  const srcAuthorization = await buildAuthorization(
    signer,
    srcChain.usdc,
    amount,
    srcChain.sender,
    srcChainId
  );

  const dstAuthorization = await buildAuthorization(
    signer,
    dstChain.usdc,
    dstMaxFee,
    dstChain.receiver,
    dstChainId
  );

  const relay = new GelatoRelay();

  const sender = new ethers.Interface(SenderAbi);
  const receiver = new ethers.Interface(ReceiverAbi);

  const depositForBurn = sender.encodeFunctionData("depositForBurn", [
    amount,
    srcMaxFee,
    dstChain.domain,
    srcAuthorization,
  ]);

  const tx = await relayAndWait(
    relay,
    srcChain.sender,
    depositForBurn,
    srcChainId,
    srcChain.usdc,
    signer
  );

  const receipt = await poll(
    () => provider.getTransactionReceipt(tx),
    (receipt) => receipt !== null,
    1_000,
    30 * 1_000
  );

  if (!receipt) throw new Error("Failed to find transaction receipt");

  const topic = ethers.solidityPackedKeccak256(
    ["string"],
    ["MessageSent(bytes)"]
  );

  const log = receipt.logs.find((x) => x.topics[0] === topic);
  if (!log) throw new Error("Failed to find message event");

  const [messageBytes] = ethers.AbiCoder.defaultAbiCoder().decode(
    ["bytes"],
    log.data
  );

  const messageHash = ethers.keccak256(messageBytes);

  const { attestation } = await poll<AttestationStatus>(
    () => jetch(`${CIRCLE_API}/attestations/${messageHash}`),
    ({ status }) => status === AttestationState.Complete,
    30 * 1_000,
    30 * 60 * 1_000
  );

  const receiveMessage = receiver.encodeFunctionData("receiveMessage", [
    signer.address,
    dstMaxFee,
    messageBytes,
    attestation,
    dstAuthorization,
  ]);

  await relayAndWait(
    relay,
    dstChain.receiver,
    receiveMessage,
    dstChainId,
    dstChain.usdc
  );
};

const buildAuthorization = async (
  signer: ethers.Wallet,
  token: string,
  value: bigint,
  to: string,
  chainId: bigint
): Promise<Authorization> => {
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

  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 60 * 60;
  const nonce = ethers.randomBytes(32);

  const args = {
    from: signer.address,
    to,
    value: value,
    validAfter,
    validBefore,
    nonce,
  };

  const sig = await signer.signTypedData(domain, types, args);
  const { v, r, s } = ethers.Signature.from(sig);

  return {
    validAfter,
    validBefore,
    nonce,
    v,
    r,
    s,
  };
};

const relayAndWait = async (
  relay: GelatoRelay,
  target: string,
  data: string,
  chainId: bigint,
  feeToken: string,
  signer?: ethers.Wallet
): Promise<string> => {
  const { taskId } = await (signer
    ? callWithSyncFeeERC2771(relay, target, data, chainId, feeToken, signer)
    : callWithSyncFee(relay, target, data, chainId, feeToken));

  const { task } = await poll<TaskStatus>(
    () => jetch(GELATO_API + "/tasks/status/" + taskId),
    ({ task }) =>
      task.taskState === TaskState.Success ||
      task.taskState === TaskState.Cancelled,
    1000,
    10 * 60 * 1_000
  );

  if (task.taskState !== TaskState.Success)
    throw new Error("Failed to relay transaction");

  return task.transactionHash;
};

const callWithSyncFee = (
  relay: GelatoRelay,
  target: string,
  data: string,
  chainId: bigint,
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
  relay: GelatoRelay,
  target: string,
  data: string,
  chainId: bigint,
  feeToken: string,
  signer: ethers.Wallet
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
