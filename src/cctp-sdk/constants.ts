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
    forwarder: "0x61D7E5486CE147BD8862Da2003b43BAf727d46c4",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [CHAIN_ID.arbitrum]: {
    domain: 3,
    forwarder: "0x9980C80596ccD0Fcb6EB578905400054a3320da9",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
