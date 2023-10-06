
import { DeployFunction } from "hardhat-deploy/types";
import { ChainId, NETWORKS } from "../src/cctp-sdk/constants";
import hre from "hardhat";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const chainId = await hre.getChainId();
  const accounts = await hre.getNamedAccounts();
  const network = NETWORKS[Number(chainId) as ChainId];

  if (!network) throw new Error("Unsupported network");

  // Deploy the TokenProxy contract for the Gnosis Chain network
  if(network == NETWORKS.GnosisChain){
    let tokenProxyDeployment = await hre.deployments.deploy("TokenProxy", {
       from: accounts.deployer,
       log: !isHardhat,
    });
    await hre.deployments.log(
        "TokenProxy deployed at: ", 
        tokenProxyDeployment.receipt.contractAddress
    );
  }

  // Deploy the USDC implementation contract for Gnosis Chain
  if(network == NETWORKS.GnosisChain){
    let usdcDeployment = await hre.deployments.deploy("USDC", {
       from: accounts.deployer,
       log: !isHardhat,
    });
    await hre.deployments.log(
        "USDC deployed at: ", 
        usdcDeployment.receipt.contractAddress
    );
  }

  await hre.deployments.deploy("GelatoCCTPSender", {
    from: accounts.deployer,
    args: [network.usdc, network.circleTokenMessenger],
    log: !isHardhat,
  });
};

func.tags = ["GelatoCCTPSender"];
func.skip = async () => !isHardhat;

export default func;