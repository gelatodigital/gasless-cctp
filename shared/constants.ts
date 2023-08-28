import { CHAIN_ID } from "../src/cctp-sdk/constants";

interface Network {
  usdc: string;
  tokenMessenger: string;
  messageTransmitter: string;
}

export const ADDRESSES: { [id: string]: Network | undefined } = {
  [CHAIN_ID.avalanche.toString()]: {
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    tokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
    messageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
  },
  [CHAIN_ID.arbitrum.toString()]: {
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    tokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    messageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
  },
};
