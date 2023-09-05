import { DeployFunction } from "hardhat-deploy/types";
import { CONSTANTS, ChainId } from "../src/cctp-sdk/constants";
import hre from "hardhat";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const chainId = await hre.getChainId();
  const accounts = await hre.getNamedAccounts();
  const constants = CONSTANTS[Number(chainId) as ChainId];

  if (!constants) throw new Error("Unsupported network");

  await hre.deployments.deploy("GelatoCCTPReceiver", {
    from: accounts.deployer,
    args: [constants.usdc, constants.messageTransmitter],
    log: !isHardhat,
  });
};

func.tags = ["GelatoCCTPReceiver"];
func.skip = async () => !isHardhat;

export default func;
