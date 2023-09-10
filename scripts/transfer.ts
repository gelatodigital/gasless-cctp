import { ethers } from "hardhat";
import { transfer } from "../src/cctp-sdk";
import { ChainId } from "../src/cctp-sdk/constants";

const main = async () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");

  // provider is a placeholder
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

  await transfer(
    ethers.parseUnits("3", 6),
    ethers.parseUnits("1", 6),
    ethers.parseUnits("1", 6),
    ChainId.Avalanche,
    ChainId.Arbitrum,
    wallet
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
