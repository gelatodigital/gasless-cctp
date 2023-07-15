import { deployments, getNamedAccounts } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("PermitForwarder", {
    from: deployer,
    log: true,
  });
};

func.tags = ["PermitForwarder"];

export default func;
