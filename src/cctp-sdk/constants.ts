interface INetwork {
  domain: number;
  gelatoCCTPSender: string;
  gelatoCCTPReceiver: string;
  circleTokenMessenger: string;
  circleMessageTransmitter: string;
  usdc: string;
}

export enum ChainId {
  Avalanche = 43114,
  Arbitrum = 42161,
}

export const NETWORKS: { [id in ChainId]: INetwork } = {
  [ChainId.Avalanche]: {
    domain: 1,
    gelatoCCTPSender: "0x9b841affdd62404A7Fd1ecc384103c35CFBaeb17",
    gelatoCCTPReceiver: "0xec88F7f07bb838AC3A336C1C2868b89bE2E90a1D",
    circleTokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
    circleMessageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [ChainId.Arbitrum]: {
    domain: 3,
    gelatoCCTPSender: "0xD8279B27f574dEfA6b58A86388D712653DAc416b",
    gelatoCCTPReceiver: "0x290138D33Fb86d0E8484BF7C4b3952277d5fE4c6",
    circleTokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    circleMessageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
