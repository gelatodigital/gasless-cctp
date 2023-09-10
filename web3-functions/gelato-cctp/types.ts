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
}

export interface ITransferWithAttestation extends ITransfer {
  attestation: string;
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
