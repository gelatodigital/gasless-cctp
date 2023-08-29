import hre from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const { deployer, usdc, messageTransmitter } = await hre.getNamedAccounts();

  if (!deployer || !usdc || !messageTransmitter)
    throw new Error("Unsupported network");

  await hre.deployments.deploy("GelatoCCTPReceiver", {
    from: deployer,
    args: [usdc, messageTransmitter],
    log: !isHardhat,
  });
};

func.tags = ["GelatoCCTPReceiver"];
func.skip = async () => !isHardhat;

export default func;
