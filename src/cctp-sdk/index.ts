import { ethers } from "ethers";
import { CONSTANTS, ChainId } from "./constants";
import { AuthorizationStruct } from "../../typechain/contracts/GelatoCCTPSender";
import {
  CallWithSyncFeeConcurrentERC2771Request,
  GelatoRelay,
} from "@gelatonetwork/relay-sdk";
import GelatoCCTPSenderAbi from "./abi/GelatoCCTPSender.json";

export const transfer = async (
  amount: bigint,
  srcMaxFee: bigint,
  dstMaxFee: bigint,
  srcChainId: ChainId,
  dstChainId: ChainId,
  signer: ethers.Wallet
): Promise<void> => {
  if (srcChainId === dstChainId)
    throw new Error("Source and destination chain must be different");

  if (srcMaxFee + dstMaxFee > amount)
    throw new Error("Max fee amount exceeds total amount");

  const src = CONSTANTS[srcChainId];
  const dst = CONSTANTS[dstChainId];

  const srcAuthorization = await buildAuthorization(
    signer,
    src.usdc,
    amount,
    src.gelatoSender,
    srcChainId
  );

  const dstAuthorization = await buildAuthorization(
    signer,
    dst.usdc,
    dstMaxFee,
    dst.gelatoReceiver,
    dstChainId
  );

  const relay = new GelatoRelay();
  const gelatoSender = new ethers.Interface(GelatoCCTPSenderAbi);

  const depositForBurn = gelatoSender.encodeFunctionData("depositForBurn", [
    amount,
    srcMaxFee,
    dstMaxFee,
    dst.domain,
    srcAuthorization,
    dstAuthorization,
  ]);

  const request: CallWithSyncFeeConcurrentERC2771Request = {
    chainId: BigInt(srcChainId),
    target: src.gelatoSender,
    data: depositForBurn,
    user: signer.address,
    feeToken: src.usdc,
    isConcurrent: true,
  };

  await relay.callWithSyncFeeERC2771(request, signer, {
    retries: 0,
  });
};

const buildAuthorization = async (
  signer: ethers.Wallet,
  token: string,
  value: bigint,
  to: string,
  chainId: number
): Promise<AuthorizationStruct> => {
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
