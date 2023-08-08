import { ethers } from "hardhat";
import { transfer } from "../src/cctp-sdk";
import { CHAIN_ID } from "../src/cctp-sdk/constants";

const main = async () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

  await transfer(
    ethers.utils.parseUnits("10", 6).toBigInt(),
    ethers.utils.parseUnits("1", 6).toBigInt(),
    ethers.utils.parseUnits("1", 6).toBigInt(),
    CHAIN_ID.arbitrum,
    wallet
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
