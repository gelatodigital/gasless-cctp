import { AuthorizationStruct } from "../../typechain/contracts/GelatoCCTPReceiver";

export enum TaskState {
  CheckPending = "CheckPending",
  ExecPending = "ExecPending",
  ExecSuccess = "ExecSuccess",
  WaitingForConfirmation = "WaitingForConfirmation",
}

export enum AttesationState {
  Complete = "complete",
}

export enum TransferState {
  PendingAttestation = "PendingAttestation",
  PendingRelayRequest = "PendingRelayRequest",
  PendingConfirmation = "PendingConfirmation",
  Confirmed = "Confirmed",
}

export interface IAttestation {
  attestation: string;
  status: AttesationState;
}

export interface ITransfer {
  owner: string;
  maxFee: bigint;
  domain: number;
  message: string;
  authorization: AuthorizationStruct;
  state: TransferState;
  expiry: number;
  attestation?: string;
  taskId?: string;
}

export interface IRelayRequestResponse {
  taskId: string;
}

export interface IRelayTaskStatus {
  taskState: TaskState;
}

export interface IRelayTaskStatusResponse {
  task: IRelayTaskStatus;
}
