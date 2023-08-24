import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.21",
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/arbitrum",
      },
      chainId: 42161,
    },
    avalanche: {
      chainId: 43114,
      url: "https://rpc.ankr.com/avalanche",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    arbitrum: {
      chainId: 42161,
      url: "https://rpc.ankr.com/arbitrum",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_KEY,
    },
  },
};

export default config;
