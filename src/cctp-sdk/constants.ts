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
    forwarder: "0x290138D33Fb86d0E8484BF7C4b3952277d5fE4c6",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [CHAIN_ID.arbitrum]: {
    domain: 3,
    forwarder: "0x836830f9faC5359F0C6EaC30BE0e0B3d1fa7A9d9",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
