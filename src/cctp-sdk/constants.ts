interface IConstants {
  domain: number;
  gelatoSender: string;
  gelatoReceiver: string;
  tokenMessenger: string;
  messageTransmitter: string;
  usdc: string;
}

export enum ChainId {
  Avalanche = 43114,
  Arbitrum = 42161,
}

export const CONSTANTS: { [id in ChainId]: IConstants } = {
  [ChainId.Avalanche]: {
    domain: 1,
    gelatoSender: "0x906249f1e4574C8536db134e557551dbA00D0a2C",
    gelatoReceiver: "0xcd1E65628e7cA6334CB9f62Ad3A54b717BcdA343",
    tokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
    messageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [ChainId.Arbitrum]: {
    domain: 3,
    gelatoSender: "0x4ACE92Ed3B003AbB165f7d15eec744baD8c905e0",
    gelatoReceiver: "0x295B5ec96693783675b20eB26678b87F2cF89701",
    tokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    messageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
