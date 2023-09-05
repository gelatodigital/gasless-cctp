import { ethers } from "ethers";
import { join } from "./helper";
import {
  GelatoCCTPReceiver__factory,
  GelatoCCTPSender__factory,
  IMessageTransmitter__factory,
} from "../../typechain";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import {
  ITransferWithAttestation,
  AttestationStatus,
  IRelayRequest,
  IAttestation,
  ITransfer,
} from "./types";
import {
  CONSTANTS,
  GELATO_API,
  CIRCLE_API,
} from "../../src/cctp-sdk/constants";
import ky from "ky";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

Web3Function.onRun(async (context: Web3FunctionContext) => {
  // index events from one network at a time
  // execute transfers from one network at a time
  const indexStr = await context.storage.get("index");
  const index = indexStr ? parseInt(indexStr) : 0;

  const nextindex = (index + 1) % Object.keys(CONSTANTS).length;
  await context.storage.set("index", nextindex.toString());

  const [chainId, constants] = Object.entries(CONSTANTS)[index];
  const provider = await context.multiChainProvider.chainId(Number(chainId));

  const toBlock = await provider.getBlockNumber();
  const fromBlockStr = await context.storage.get(chainId);
  const fromBlock = fromBlockStr ? parseInt(fromBlockStr) : toBlock;

  const pendingStr = await context.storage.get("pending");
  const pending: ITransfer[] = pendingStr ? JSON.parse(pendingStr) : [];

  const runner = { provider: provider as any };

  const messageTransmitter = IMessageTransmitter__factory.connect(
    constants.messageTransmitter,
    runner
  );

  const gelatoReceiver = GelatoCCTPReceiver__factory.connect(
    constants.gelatoReceiver,
    runner
  );

  const gelatoSender = GelatoCCTPSender__factory.connect(
    constants.gelatoSender,
    runner
  );

  // index all logs since last processed block
  // both MessageTransmitter and GelatoCCTPSender emit on depositForBurn
  // every GelatoCCTPSender event corresponds to a MessageTransmitter event
  // but not every MessageTransmitter event corresponds to a GelatoCCTPSender
  // we must merge these events together based on their transactionHash
  const messages = await messageTransmitter.queryFilter(
    messageTransmitter.filters.MessageSent,
    fromBlock,
    toBlock
  );

  const deposits = await gelatoSender.queryFilter(
    gelatoSender.filters.DepositForBurn,
    fromBlock,
    toBlock
  );

  join(
    messages,
    deposits,
    (a, b) => a.transactionHash === b.transactionHash,
    (a, b): ITransfer => ({
      owner: b.args.owner,
      maxFee: b.args.maxFee,
      domain: Number(b.args.domain),
      message: a.args.message,
      authorization: b.args.authorization,
    })
  ).forEach((x) => pending.push(x));

  // iterate through pending transfers backwards
  // move executable transfers from pending to executable
  const executable: ITransferWithAttestation[] = [];
  for (let i = pending.length - 1; i >= 0; i--) {
    if (pending[i].domain !== constants.domain) continue;

    const messageHash = ethers.keccak256(pending[i].message);

    const { status, attestation } = (await ky
      .get(`${CIRCLE_API}/attestations/${messageHash}`)
      .json()) as IAttestation;

    if (status !== AttestationStatus.Complete) continue;

    executable.push({ ...pending[i], attestation });
    pending.splice(i, 1);
  }

  // execute all executable transfers
  // we initiate all requests and then await them
  // this is more efficient than awaiting one at a time
  await Promise.all(
    executable.map(async (transfer) => {
      const tx = await gelatoReceiver.receiveMessage.populateTransaction(
        transfer.owner,
        transfer.maxFee,
        transfer.message,
        transfer.attestation,
        transfer.authorization
      );

      const request: IRelayRequest = {
        chainId: Number(chainId),
        target: tx.to,
        data: tx.data,
        feeToken: constants.usdc,
        retries: 0,
      };

      await ky
        .post(`${GELATO_API}/relays/v2/call-with-sync-fee`, {
          json: request,
        })
        .json();
    })
  );

  // update pending transfers in storage
  // move cursor to current block + 1 (don't want to index the same block)
  await context.storage.set("pending", JSON.stringify(pending));
  await context.storage.set(chainId, (toBlock + 1).toString()); // what if in future?

  console.log("indexed:", deposits.length);
  console.log("executed:", executable.length);
  console.log("pending:", pending.length);

  return { canExec: false, message: "" };
});
