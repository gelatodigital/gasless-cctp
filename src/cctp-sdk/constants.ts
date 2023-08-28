interface ChainType {
  domain: number;
  sender: string;
  receiver: string;
  usdc: string;
}

export const CHAIN_ID: { [name: string]: bigint } = {
  avalanche: 43114n,
  arbitrum: 42161n,
};

export const CHAIN: { [id: string]: ChainType | undefined } = {
  [CHAIN_ID.avalanche.toString()]: {
    domain: 1,
    sender: "0x12d4E52d2547f9c6d9DB2e79b6B7C6EA8916E101",
    receiver: "0xcd1E65628e7cA6334CB9f62Ad3A54b717BcdA343",
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  [CHAIN_ID.arbitrum.toString()]: {
    domain: 3,
    sender: "0xDFa48EFb5F63335EcaFC8b23ddE9188b368A0d7a",
    receiver: "0x295B5ec96693783675b20eB26678b87F2cF89701",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
};

export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
