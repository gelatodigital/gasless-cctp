import { DeployFunction } from "hardhat-deploy/types";
import { NETWORKS, ChainId } from "../src/cctp-sdk/constants";
import hre from "hardhat";

const isHardhat = hre.network.name === "hardhat";
const gnosisChainId = 44291; // Add Gnosis chain ID

const func: DeployFunction = async () => {
  const chainId = await hre.getChainId();
  const accounts = await hre.getNamedAccounts();
  const network = NETWORKS[Number(chainId) as ChainId];

  if (!network) throw new Error("Unsupported network");

  await hre.deployments.deploy("GelatoCCTPReceiver", {
    from: accounts.deployer,
    args: [network.usdc, network.circleMessageTransmitter],
    log: !isHardhat,
  });

  // Added upgrade logic for the GnosisChain network
  if (Number(chainId) === gnosisChainId) {
    const GelatoCCTPReceiver = await hre.ethers.getContractFactory("GelatoCCTPReceiver");
    let instance = await GelatoCCTPReceiver.deploy();
    await instance.deployed();

    const proxy = await hre.upgrades.deployProxy(GelatoCCTPReceiver, [network.usdc, network.circleMessageTransmitter]);
    console.log("Deployed at:", proxy.address); 

    await hre.upgrades.upgradeProxy(proxy.address, GelatoCCTPReceiver);
    console.log("Upgrade applied at:", proxy.address);
  }
};

func.tags = ["GelatoCCTPReceiver"];
func.skip = async () => !isHardhat;

export default func;