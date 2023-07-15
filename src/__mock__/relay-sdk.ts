import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";
import { FEE_COLLECTOR, GELATO_RELAY } from "./constants";
import { IERC20 } from "../../typechain";
import { ethers } from "hardhat";

/**
 * Emulates relay behaviour locally
 * https://github.com/gelatodigital/rel-example-unit-tests
 */

export const callWithSyncFee = async (request: CallWithSyncFeeRequest) => {
  const fee = 10n ** 6n;

  const data = ethers.utils.solidityPack(
    ["bytes", "address", "address", "uint256"],
    [request.data, FEE_COLLECTOR, request.feeToken, fee]
  );

  const relay = await ethers.getImpersonatedSigner(GELATO_RELAY);
  const token = (await ethers.getContractAt(
    "IERC20",
    request.feeToken
  )) as IERC20;

  await setBalance(relay.address, ethers.utils.parseEther("1"));

  const balanceBefore = await token.balanceOf(FEE_COLLECTOR);
  const tx = await relay.sendTransaction({ to: request.target, data });
  const balanceAfter = await token.balanceOf(FEE_COLLECTOR);

  if (balanceAfter.sub(balanceBefore).lt(fee))
    throw new Error("Insufficient relay fee");

  return tx;
};
