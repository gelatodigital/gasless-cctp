import hre from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const { deployer, usdc, tokenMessenger } = await hre.getNamedAccounts();

  if (!deployer || !usdc || !tokenMessenger)
    throw new Error("Unsupported network");

  await hre.deployments.deploy("GelatoCCTPSender", {
    from: deployer,
    args: [usdc, tokenMessenger],
    log: !isHardhat,
  });
};

func.tags = ["GelatoCCTPSender"];
func.skip = async () => !isHardhat;

export default func;
