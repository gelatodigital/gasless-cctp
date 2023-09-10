import { DeployFunction } from "hardhat-deploy/types";
import { NETWORKS, ChainId } from "../src/cctp-sdk/constants";
import hre from "hardhat";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const chainId = await hre.getChainId();
  const accounts = await hre.getNamedAccounts();
  const network = NETWORKS[Number(chainId) as ChainId];

  if (!network) throw new Error("Unsupported network");

  await hre.deployments.deploy("GelatoCCTPSender", {
    from: accounts.deployer,
    args: [network.usdc, network.circleTokenMessenger],
    log: !isHardhat,
  });
};

func.tags = ["GelatoCCTPSender"];
func.skip = async () => !isHardhat;

export default func;
