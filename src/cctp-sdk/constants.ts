interface ChainType {
  domain: number;
  forwarder: string;
  usdc: string;
}

export const CHAIN_ID: { [name: string]: number } = {
  avalanche: 43114,
  arbitrum: 42161,
};

export const CHAIN: { [id: number]: ChainType | undefined } = {
  [CHAIN_ID.avalanche]: {
    domain: 1,
    forwarder: "0x66861B36d835bf0419324CE3d10BF25d2AE57dD7",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [CHAIN_ID.arbitrum]: {
    domain: 3,
    forwarder: "0x9190E6F734FE3E3AC548AF3d93B82581E8BB7ace",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
