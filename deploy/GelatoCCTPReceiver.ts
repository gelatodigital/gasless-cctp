import { deployments, getChainId, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ADDRESSES } from "../shared/constants";

const name = "GelatoCCTPReceiver";

const func: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();
  const address = ADDRESSES[chainId];

  if (!address) throw new Error("Unsupported network");

  const { usdc, messageTransmitter } = address;

  await deploy(name, {
    from: deployer,
    args: [usdc, messageTransmitter],
    log: true,
  });
};

func.tags = [name];

export default func;
