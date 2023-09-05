import { AuthorizationStruct } from "../../typechain/contracts/GelatoCCTPReceiver";

export enum AttestationStatus {
  Pending = "pending",
  Complete = "complete",
}

export interface IAttestation {
  status: AttestationStatus;
  attestation: string;
}

export interface ITransfer {
  owner: string;
  maxFee: bigint;
  domain: number;
  message: string;
  authorization: AuthorizationStruct;
}

export interface ITransferWithAttestation extends ITransfer {
  attestation: string;
}

export interface IRelayRequest {
  chainId: number;
  target: string;
  data: string;
  feeToken: string;
  retries?: number;
}
