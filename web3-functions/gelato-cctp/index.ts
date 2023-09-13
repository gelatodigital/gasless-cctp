import { ITransfer, TaskState, TransferState } from "./types";
import { getAttestation, getRelayTaskStatus, postCallWithSyncFee } from "./api";
import { CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";
import { ChainId, NETWORKS } from "../../src/cctp-sdk/constants";
import { timeout } from "./constants";
import { ethers } from "ethers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import {
  IMessageTransmitter__factory,
  GelatoCCTPReceiver__factory,
  GelatoCCTPSender__factory,
} from "../../typechain";

// eslint-disable-next-line
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
  // todo: implemented via block confirmations or use event based trigger
  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await context.storage.get(chainId);
  const lastBlock = lastBlockStr ? Number(lastBlockStr) : currentBlock;

  if (!lastBlockStr)
    await context.storage.set(chainId, currentBlock.toString());

  // if no blocks have passed since last execution, return early
  // no reason to check attestations since the attestation service waits for new blocks
  if (currentBlock === lastBlock)
    return { canExec: false, message: "No blocks to index" };

  // get stored transfer requests
  const transferRequestsStr = await context.storage.get("transfers");
  const transferRequests: ITransfer[] = transferRequestsStr
    ? JSON.parse(transferRequestsStr)
    : [];

  // instantiate all contracts on the current network
  // eslint-disable-next-line
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

  // query the state of all relayed transfers and mark successful transfers as confirmed
  // retry failed transfers by marking them as pending relay request
  // the relay request will be resubmitted
  await Promise.all(
    transferRequests.map(async (transfer, index): Promise<void> => {
      if (
        transfer.state !== TransferState.PendingConfirmation ||
        !transfer.taskId
      )
        return;

      const taskStatus = await getRelayTaskStatus(transfer.taskId);
      if (!taskStatus) return;

      if (
        taskStatus.taskState === TaskState.CheckPending ||
        taskStatus.taskState === TaskState.ExecPending ||
        taskStatus.taskState === TaskState.WaitingForConfirmation
      )
        return;

      if (taskStatus.taskState === TaskState.ExecSuccess)
        transferRequests[index].state = TransferState.Confirmed;
      else {
        console.error("Retrying transfer:", transfer.taskId);
        transferRequests[index].state = TransferState.PendingRelayRequest;
      }
    })
  );

  // index all events since last processed block
  // todo: split whole block range into smaller subranges (max 10,000)
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
  const indexedTransferRequests = gelatoDepositForBurns.map(
    (deposit): ITransfer => {
      const message = circleMessageSents.find(
        (message) => message.transactionHash === deposit.transactionHash
      )!;

      return {
        owner: deposit.args.owner,
        maxFee: deposit.args.maxFee,
        domain: Number(deposit.args.domain),
        message: message.args.message,
        authorization: deposit.args.authorization,
        state: TransferState.PendingAttestation,
        expiry: Date.now() + timeout,
      };
    }
  );

  // add newly indexed transfer requests to transfer requests
  transferRequests.push(...indexedTransferRequests);

  // fetch attestations for transfers pending attestation
  await Promise.all(
    transferRequests.map(async (transfer, index): Promise<void> => {
      if (transfer.state !== TransferState.PendingAttestation) return;

      const messageHash = ethers.keccak256(transfer.message);
      const attestation = await getAttestation(messageHash);

      if (!attestation) return;

      transferRequests[index].attestation = attestation;
      transferRequests[index].state = TransferState.PendingRelayRequest;
    })
  );

  // execute all executable transfers
  // store their corresponding taskIds to manage their lifetime
  await Promise.all(
    transferRequests.map(async (transfer, index): Promise<void> => {
      if (
        transfer.state !== TransferState.PendingRelayRequest ||
        transfer.domain !== network.domain ||
        !transfer.attestation
      )
        return;

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

      const taskId = await postCallWithSyncFee(request);
      if (!taskId) return;

      transferRequests[index].taskId = taskId;
      transferRequests[index].state = TransferState.PendingConfirmation;
    })
  );

  // filter out confirmed and expired transfers
  const remainingTransferRequests = transferRequests.filter(
    (transfer) =>
      transfer.state !== TransferState.Confirmed && transfer.expiry > Date.now()
  );

  // store remaining transfer requests
  await context.storage.set(
    "transfers",
    JSON.stringify(remainingTransferRequests)
  );

  // store the last processed block
  await context.storage.set(chainId, currentBlock.toString());

  // get the number of transfers in a given state
  const stateCount = transferRequests.reduce(
    (prev, transfer) => {
      prev[transfer.state]++;
      return prev;
    },
    {
      Confirmed: 0,
      PendingAttestation: 0,
      PendingConfirmation: 0,
      PendingRelayRequest: 0,
    } as { [key in TransferState]: number }
  );

  const message =
    `network: ${ChainId[Number(chainId) as ChainId]}, ` +
    `processed: ${currentBlock - lastBlock}, ` +
    `indexed: ${gelatoDepositForBurns.length}, ` +
    `attesting: ${stateCount[TransferState.PendingAttestation]}, ` +
    `executed: ${stateCount[TransferState.PendingConfirmation]}, ` +
    `confirmed: ${stateCount[TransferState.Confirmed]}`;

  return { canExec: false, message };
});
