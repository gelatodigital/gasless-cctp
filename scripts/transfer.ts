import { ethers } from "ethers";
import { transfer, ChainId } from "../src/cctp-sdk";

const main = async () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");

  const wallet = new ethers.Wallet(PRIVATE_KEY);

  const taskId = await transfer(
    wallet.address,
    ethers.parseUnits("10", 6),
    ethers.parseUnits("1", 6),
    ethers.parseUnits("1", 6),
    ChainId.GnosisChain,
    ChainId.Arbitrum,
    wallet.signTypedData.bind(wallet)
  );

  console.log("https://api.gelato.digital/tasks/status/" + taskId);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
