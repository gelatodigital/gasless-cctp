import { NETWORKS, ChainId } from "./constants";
import { IAuthorization, ISign } from "./types";
import { TypedDataField, ethers } from "ethers";
import {
  GelatoRelay,
  ERC2771Type,
  CallWithConcurrentERC2771Request,
} from "@gelatonetwork/relay-sdk";
import GelatoCCTPSenderAbi from "./abi/GelatoCCTPSender.json";

export { ChainId };

export const transfer = async (
  owner: string,
  amount: bigint,
  srcMaxFee: bigint,
  dstMaxFee: bigint,
  srcChainId: ChainId,
  dstChainId: ChainId,
  signTypedData: ISign
): Promise<string> => {
  if (srcChainId === dstChainId)
    throw new Error(
      "cctp-sdk.transfer: Source and destination chain must be different"
    );

  if (srcMaxFee + dstMaxFee > amount)
    throw new Error("cctp-sdk.transfer: Max fee amount exceeds total amount");

  const src = NETWORKS[srcChainId];
  const dst = NETWORKS[dstChainId];

  const srcAuthorization = await buildAuthorization(
    owner,
    src.usdc,
    amount,
    src.gelatoCCTPSender,
    srcChainId,
    signTypedData
  );

  const dstAuthorization = await buildAuthorization(
    owner,
    dst.usdc,
    dstMaxFee,
    dst.gelatoCCTPReceiver,
    dstChainId,
    signTypedData
  );

  const relay = new GelatoRelay();
  const gelatoCCTPSender = new ethers.Interface(GelatoCCTPSenderAbi);

  const depositForBurn = gelatoCCTPSender.encodeFunctionData("depositForBurn", [
    amount,
    srcMaxFee,
    dstMaxFee,
    dst.domain,
    srcAuthorization,
    dstAuthorization,
  ]);

  const request: CallWithConcurrentERC2771Request = {
    chainId: BigInt(srcChainId),
    target: src.gelatoCCTPSender,
    data: depositForBurn,
    user: owner,
    isConcurrent: true,
  };

  const { struct, typedData } = await relay.getDataToSignERC2771(
    request,
    ERC2771Type.ConcurrentCallWithSyncFee
  );

  // eslint-disable-next-line
  const { EIP712Domain: _, ...types } = typedData.types as Record<
    string,
    Array<TypedDataField>
  >;

  const signature = await signTypedData(
    typedData.domain,
    types,
    typedData.message
  );

  const { taskId } = await relay.callWithSyncFeeERC2771WithSignature(
    struct,
    { feeToken: src.usdc },
    signature,
    { retries: 0 }
  );

  return taskId;
};

const buildAuthorization = async (
  owner: string,
  token: string,
  value: bigint,
  to: string,
  chainId: number,
  signTypedData: ISign
): Promise<IAuthorization> => {
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
    from: owner,
    to,
    value,
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await signTypedData(domain, types, args);
  const { v, r, s } = ethers.Signature.from(signature);

  return {
    validAfter,
    validBefore,
    nonce,
    v,
    r,
    s,
  };
};
