import { ethers } from "ethers";
import { transfer } from "../src/cctp-sdk";
import { ChainId } from "../src/cctp-sdk/constants";

const main = async () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");

  const wallet = new ethers.Wallet(PRIVATE_KEY);

  const signTypedData = async (
    domain: ethers.TypedDataDomain,
    types: Record<string, Array<ethers.TypedDataField>>,
    // eslint-disable-next-line
    value: Record<string, any>
  ): Promise<string> => wallet.signTypedData(domain, types, value);

  const taskId = await transfer(
    wallet.address,
    ethers.parseUnits("3", 6),
    ethers.parseUnits("1", 6),
    ethers.parseUnits("1", 6),
    ChainId.Avalanche,
    ChainId.Arbitrum,
    signTypedData
  );

  console.log("https://api.gelato.digital/tasks/status/" + taskId);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
