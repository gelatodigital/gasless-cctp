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
    forwarder: "0xD8279B27f574dEfA6b58A86388D712653DAc416b",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [CHAIN_ID.arbitrum]: {
    domain: 3,
    forwarder: "0x706284A37B4615bD3354AC5A8aC6aa5e10F3DDC5",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
