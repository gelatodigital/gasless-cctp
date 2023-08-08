import { deployments, ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

interface Network {
  usdc: string;
  tokenMessenger: string;
  messageTransmitter: string;
}

const chainId: { [name: string]: number } = {
  avalanche: 43114,
  arbitrum: 42161,
};

export const ADDRESSES: { [id: number]: Network | undefined } = {
  [chainId.avalanche]: {
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    tokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
    messageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
  },
  [chainId.arbitrum]: {
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    tokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    messageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
  },
};

const name = "Forwarder";

const func: DeployFunction = async () => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const chainId = await deployer.getChainId();
  const address = ADDRESSES[chainId];
  if (!address) throw new Error("Unsupported network");

  const { usdc, tokenMessenger, messageTransmitter } = address;

  await deploy(name, {
    from: deployer.address,
    args: [usdc, tokenMessenger, messageTransmitter],
    log: true,
  });
};

func.tags = [name];

export default func;
