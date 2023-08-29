import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

enum ChainID {
  Avalanche = 43114,
  Arbitrum = 42161,
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: { enabled: true, runs: 999999 },
          evmVersion: "paris",
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
  // typesc
  namedAccounts: {
    deployer: {
      default: 0,
    },
    usdc: {
      [ChainID.Avalanche]: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      [ChainID.Arbitrum]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    },
    tokenMessenger: {
      [ChainID.Avalanche]: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
      [ChainID.Arbitrum]: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    },
    messageTransmitter: {
      [ChainID.Avalanche]: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
      [ChainID.Arbitrum]: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/arbitrum",
      },
      chainId: ChainID.Arbitrum,
    },
    avalanche: {
      chainId: ChainID.Avalanche,
      url: "https://rpc.ankr.com/avalanche",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    arbitrum: {
      chainId: ChainID.Arbitrum,
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
