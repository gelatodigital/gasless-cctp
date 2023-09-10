import { NETWORKS } from "../../src/cctp-sdk/constants";
import { CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";
import { ITransferWithAttestation, ITransfer, TaskState } from "./types";
import { getAttestation, getRelayTaskStatus, postRelayRequest } from "./api";
import { ethers } from "ethers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import {
  GelatoCCTPReceiver__factory,
  GelatoCCTPSender__factory,
  IMessageTransmitter__factory,
} from "../../typechain";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

Web3Function.onRun(async (context: Web3FunctionContext) => {
  // index events from one network at a time
  // execute transfers from the current network
  const networkIndexStr = await context.storage.get("network");
  const networkIndex = networkIndexStr ? Number(networkIndexStr) : 0;

  // set next index immediately
  // if any subsequent operation fails we still serve other networks
  const nextNetworkIndex = (networkIndex + 1) % Object.keys(NETWORKS).length;
  await context.storage.set("network", nextNetworkIndex.toString());

  const [chainId, network] = Object.entries(NETWORKS)[networkIndex];
  const provider = await context.multiChainProvider.chainId(Number(chainId));

  // event indexing contains no reorg protection
  // this can be implemented via block confirmations
  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await context.storage.get(chainId);
  const lastBlock = lastBlockStr ? Number(lastBlockStr) : currentBlock;

  if (!lastBlockStr)
    await context.storage.set(chainId, currentBlock.toString());

  // if no blocks have passed since last execution, return early
  // no reason to check attestations since the attestation service waits for new blocks
  if (currentBlock === lastBlock)
    return { canExec: false, message: "No blocks to index" };

  // get existing pending transfers and relay tasks
  const pendingStr = await context.storage.get("pending");
  let pending: ITransfer[] = pendingStr ? JSON.parse(pendingStr) : [];

  const taskIdsStr = await context.storage.get("tasks");
  let taskIds: string[] = taskIdsStr ? JSON.parse(taskIdsStr) : [];

  // instantiate all contracts on the current network
  const runner = { provider: provider as any };

  const circleMessageTransmitter = IMessageTransmitter__factory.connect(
    network.circleMessageTransmitter,
    runner
  );

  const gelatoCCTPReceiver = GelatoCCTPReceiver__factory.connect(
    network.gelatoCCTPReceiver,
    runner
  );

  const gelatoCCTPSender = GelatoCCTPSender__factory.connect(
    network.gelatoCCTPSender,
    runner
  );

  // check each task status
  const tasks = await Promise.all(
    taskIds.map((taskId) => getRelayTaskStatus(taskId))
  );

  // keep pending tasks and remove executed or failed tasks
  // signal on failure (this could trigger an API call to notify the user)
  taskIds = taskIds.filter((taskId, i) => {
    const task = tasks[i];
    if (!task) return true;

    if (
      task.taskState === TaskState.CheckPending ||
      task.taskState === TaskState.ExecPending ||
      task.taskState === TaskState.WaitingForConfirmation
    )
      return true;

    if (task.taskState !== TaskState.ExecSuccess)
      console.error("Task failed:", taskId);

    console.log("Transfer complete:", taskId);
    return false;
  });

  // index all events since last processed block
  // the whole block range could be split into smaller ranges (max 10,000)
  const circleMessageSents = await circleMessageTransmitter.queryFilter(
    circleMessageTransmitter.filters.MessageSent,
    lastBlock + 1,
    currentBlock
  );

  const gelatoDepositForBurns = await gelatoCCTPSender.queryFilter(
    gelatoCCTPSender.filters.DepositForBurn,
    lastBlock + 1,
    currentBlock
  );

  // both MessageTransmitter and GelatoCCTPSender emit on depositForBurn
  // every GelatoCCTPSender event corresponds to a MessageTransmitter event
  // but not every MessageTransmitter event corresponds to a GelatoCCTPSender event
  // we merge these events together based on their transactionHash
  // ths can be optimised since events are in the same order
  pending.push(
    ...gelatoDepositForBurns.map((deposit) => {
      const message = circleMessageSents.find(
        (message) => message.transactionHash === deposit.transactionHash
      )!;

      return {
        owner: deposit.args.owner,
        maxFee: deposit.args.maxFee,
        domain: Number(deposit.args.domain),
        message: message.args.message,
        authorization: deposit.args.authorization,
      };
    })
  );

  // attempt to fetch attestations for pending transfers
  const attestations = await Promise.all(
    pending.map((transfer) => {
      const messageHash = ethers.keccak256(transfer.message);
      return getAttestation(messageHash);
    })
  );

  // move executable transfers from pending to executable
  const executable: ITransferWithAttestation[] = [];
  pending = pending.filter((transfer, i) => {
    const attestation = attestations[i];

    if (!attestation || transfer.domain !== network.domain) return true;

    executable.push({ ...transfer, attestation });
    return false;
  });

  // execute all executable transfers
  // store their corresponding taskIds to manage their lifetime
  const newTaskIds = await Promise.all(
    executable.map(async (transfer) => {
      const receiveMessage =
        await gelatoCCTPReceiver.receiveMessage.populateTransaction(
          transfer.owner,
          transfer.maxFee,
          transfer.message,
          transfer.attestation,
          transfer.authorization
        );

      const request: CallWithSyncFeeRequest = {
        chainId: BigInt(chainId),
        target: receiveMessage.to,
        data: receiveMessage.data,
        feeToken: network.usdc,
      };

      const taskId = await postRelayRequest(request);

      // move failed transfers back into pending
      if (!taskId) pending.push(transfer);
      return taskId;
    })
  );

  taskIds.push(
    ...newTaskIds.filter((taskId): taskId is string => taskId !== null)
  );

  // update storage
  await context.storage.set("tasks", JSON.stringify(taskIds));
  await context.storage.set("pending", JSON.stringify(pending));
  await context.storage.set(chainId, currentBlock.toString());

  const message =
    `chainId: ${chainId}, ` +
    `processed: ${currentBlock - lastBlock}, ` +
    `indexed: ${gelatoDepositForBurns.length}, ` +
    `confirming: ${taskIds.length}, ` +
    `attesting: ${pending.length}`;

  return { canExec: false, message };
});
