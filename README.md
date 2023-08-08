# Gasless Cross-Chain Transfer Protocol
This project demonstrates gasless token transfer using [Circle's CCTP](https://developers.circle.com/stablecoin/docs) and [Gelato Relay](https://developers.circle.com/stablecoin/docs).

## What is CCTP?
*Cross-Chain Transfer Protocol (CCTP) is a permissionless on-chain utility that facilitates USDC transfers between blockchains via native burning and minting.*

**Benefits**:
- No need to **lock-and-mint**
- Unified liquidity (no synthetic tokens)

## How does CCTP work?
1. USDC is burned on the source chain
2. Circle observes the event and signs an attestation signature
3. USDC is minted on the destination chain using the attestation

**Limitations** (motivations for this project):
- Steps **one** and **three** both require user-initiated transactions on-chain
- Subsequent transactions on the destination chain require native tokens

## Vision
**With Gelato Relay we can**:
- Move USDC between chains and cover the cost using USDC
- Pay for subsequent transactions on the destination chain also using USDC

Eliminating the dependence on native tokens gives us infinitely more freedom.

**Implications**:
- USDC acts as an interoperability layer connecting multiple chains
- Eliminate the need for per-chain native tokens

> **Note**
> *Gasless* refers to the absence of native tokens for transaction fee payment.  
> Gas is still paid, but abstracted away from the user and compensated in USDC.

## Gasless CCTP Flow
1. Sign two off-chain [transfer authorization](https://eips.ethereum.org/EIPS/eip-3009) signatures.  
   These authenticate token transfers, covering the base transfer amount and relay fee.  
   [Source Code](https://github.com/gelatodigital/relay-gasless-cctp/blob/main/src/cctp-sdk/index.ts#L50-L64)
2. Relay a [`depositForBurn`](https://developers.circle.com/stablecoin/docs/cctp-tokenmessenger#depositforburn) transaction on the source chain.  
   This burns the tokens and emits `MessageSent` which is observed by Circle's attestation service.  
   [Source Code](https://github.com/gelatodigital/relay-gasless-cctp/blob/main/src/cctp-sdk/index.ts#L69-L81)
3. Fetch the attestation signature from the attestation API endpoint.  
   [Source Code](https://github.com/gelatodigital/relay-gasless-cctp/blob/main/src/cctp-sdk/index.ts#L83-L108)
4. Relay a [`receiveMessage`](https://developers.circle.com/stablecoin/docs/cctp-messagetransmitter#receivemessage) transaction on the destination chain.  
   This uses the attestation signature in order to mint the burnt tokens 1:1.  
   [Source Code](https://github.com/gelatodigital/relay-gasless-cctp/blob/main/src/cctp-sdk/index.ts#L110-L123)

An intermediary [`Forwarder`](https://github.com/gelatodigital/relay-gasless-cctp/blob/main/contracts/Forwarder.sol) contract facilitates relay fee payment. This is deployed once on each CCTP-compatible network allowing for any-any chain transfers.

## Implementation
[Implementation](https://github.com/gelatodigital/relay-gasless-cctp/blob/main/scripts/transfer.ts#L11-L17) is as simple as importing the [``cctp-sdk``]() and calling ``transfer``.

```ts
await transfer(
  amount,    // total token amount including fees
  srcMaxFee, // max relay fee on source chain
  dstMaxFee, // max relay fee on destination chain
  chainId,   // destination chainId
  wallet     // signer with source chain provider
);
```

## Quick Start

> **Warning**
> Code is not audited by a third party. Please use at your own discretion.

1. Install dependencies
   ```
   yarn install
   ```
2. Edit ``.env``
   ```
   cp .env.example .env
   ```
3. Transfer `10 USDC` from Avalanche to Arbitrum
   ```
   yarn run scripts/transfer.ts --network avalanche
   ```
