import { ethers, w3f } from "hardhat";
import {
  AutomateSDK,
  TriggerConfig,
  TriggerType,
} from "@gelatonetwork/automate-sdk";
import { ChainId, NETWORKS } from "../src/cctp-sdk/constants";

const gnosisChainId = ChainId.GnosisChain;

const getNetworkDetails = (chainId: ChainId) => {
  return NETWORKS[chainId];
};

const main = async () => {
  const cctpW3f = w3f.get("gelato-cctp");
  const cctpCid = await cctpW3f.deploy();

  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();

  if(chainId === gnosisChainId) {
    cctpW3f.gelatoCCTPSender = getNetworkDetails(gnosisChainId).gelatoCCTPSender;
    cctpW3f.gelatoCCTPReceiver = getNetworkDetails(gnosisChainId).gelatoCCTPReceiver;
    cctpW3f.circleTokenMessenger = getNetworkDetails(gnosisChainId).circleTokenMessenger;
    cctpW3f.usdc = getNetworkDetails(gnosisChainId).usdc;
  }

  // required since the automate-sdk uses ethers v5
  // eslint-disable-next-line
  (deployer as any)._isSigner = true;

  // eslint-disable-next-line
  const automate = new AutomateSDK(Number(chainId), deployer as any);

  const trigger: TriggerConfig = {
    type: TriggerType.TIME,
    interval: 30000,
  };

  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Gelato CCTP",
    web3FunctionHash: cctpCid,
    web3FunctionArgs: {},
    useTreasury: false,
    trigger,
  });

  await tx.wait();

  console.log(
    `https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});