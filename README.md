# Gasless & Automated Cross-Chain Transfer Protocol
This project demonstrates gasless & automated cross-chain token transfer using [Circle's CCTP](https://developers.circle.com/stablecoin/docs) as well as [Gelato Relay](https://www.gelato.network/relay) and [Gelato Web3 Functions](https://beta.app.gelato.network/).

> **Warning**  
> Code is not yet audited by a third party - please use at your own discretion.

## What is CCTP?
*Cross-Chain Transfer Protocol (CCTP) is a permissionless on-chain utility that facilitates USDC transfers between blockchains via native burning and minting.*

The Cross-Chain Transfer Protocol can be considered a bridge for **native** USDC.

**Benefits**:
- No need to **lock-and-mint**
- Unified liquidity (no synthetic tokens)

## How does CCTP work?
1. USDC is burned on the source chain
2. Circle observes the event and signs an attestation signature
3. USDC is minted on the destination chain using the attestation

**Limitations** (motivations for this project):
- Steps **one** and **three** both require user-initiated transactions on-chain, requiring native tokens
- Subsequent transactions on the destination chain also require native tokens
- Step **two** can take up to ~13 minutes and the user must be present to initiate the final transaction

## Vision
**With Gelato Relay and Web3 Functions we can**:
- Move USDC between chains and cover the cost using USDC
- Pay for subsequent transactions on the destination chain also using USDC
- Automate the entire process reliably in the background

Eliminating the dependence on native tokens gives us infinitely more freedom.

**Implications**:
- USDC acts as an interoperability layer connecting multiple chains
- Eliminates the need for per-chain native tokens

> **Note**  
> *Gasless* refers to the absence of native tokens during transaction fee payment.  
> Gas is still paid, but abstracted away from the user and compensated in USDC.

## Gasless & Automated CCTP Flow
1. Sign two off-chain [ERC-3009](https://eips.ethereum.org/EIPS/eip-3009) transfer authorization signatures.  
   These authenticate token transfers, covering the base transfer amount and relay fee on each network.  
   [Code Snippet](https://github.com/gelatodigital/gasless-cctp/blob/main/src/cctp-sdk/index.ts#L33-L49)
2. Sign a final [ERC-2771](https://eips.ethereum.org/EIPS/eip-2771) signature which enforces our max fee and destination domain intent.  
   We avoid making any trust assumptions since all data is verified on-chain to have been signed by the user.  
   [Code Snippet](https://github.com/gelatodigital/gasless-cctp/blob/main/src/cctp-sdk/index.ts#L82-L86)
3. Relay a [`depositForBurn`](https://developers.circle.com/stablecoin/docs/cctp-tokenmessenger#depositforburn) transaction on the source chain.  
   This burns the tokens and emits events which are observed by Circle and a Web3 Function.  
   [Code Snippet](https://github.com/gelatodigital/gasless-cctp/blob/main/src/cctp-sdk/index.ts#L88-L93)
4. The Web3 Function indexes all events and periodically fetches attestation signatures from Circle.  
   [Code Snippet](https://github.com/gelatodigital/gasless-cctp/blob/main/web3-functions/gelato-cctp/index.ts#L105-L158)
5. Once an attestation is issued, the Web3 Function relays a [`receiveMessage`](https://developers.circle.com/stablecoin/docs/cctp-messagetransmitter#receivemessage) transaction on the destination chain.  
   This uses the attestation signature in order to mint the burnt tokens 1:1.  
   [Code Snippet](https://github.com/gelatodigital/gasless-cctp/blob/main/web3-functions/gelato-cctp/index.ts#L160-L193)

Intermediary [`GelatoCCTPSender`](https://github.com/gelatodigital/gasless-cctp/blob/main/contracts/GelatoCCTPSender.sol) and [`GelatoCCTPReceiver`](https://github.com/gelatodigital/gasless-cctp/blob/main/contracts/GelatoCCTPReceiver.sol) contracts facilitate relay fee payment.
These are both deployed on each CCTP-compatible network allowing for any-any chain transfers.

![Flow Diagram](https://i.gyazo.com/6c9ca5403beaf19b9702bcbdc6bf53ab.png)

## Implementation
[Implementation](https://github.com/gelatodigital/gasless-cctp/blob/main/scripts/transfer.ts#L10-L18) is as simple as importing the [`cctp-sdk`](https://github.com/gelatodigital/gasless-cctp/tree/main/src/cctp-sdk) and calling `transfer`.

```ts
await transfer(
   owner,        // owner account address
   amount,       // total amount including fees
   srcMaxFee,    // max relay fee on the source chain
   dstMaxFee,    // max relay fee on the destination chain
   srcChainId,   // source chainId
   dstChainId,   // destination chainId
   signTypedData // callback to sign typed data
);
```

## Quick Start

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
   yarn run scripts/transfer.ts
   ```
