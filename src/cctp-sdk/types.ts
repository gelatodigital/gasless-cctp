export enum TaskState {
  Success = "ExecSuccess",
  Cancelled = "Cancelled",
}

export enum AttestationState {
  Pending = "pending",
  Complete = "complete",
}

export interface TaskStatus {
  task: {
    taskState: TaskState;
    transactionHash: string;
  };
}

export interface AttestationStatus {
  status: AttestationState;
  attestation: string;
}

export interface Authorization {
  validAfter: number;
  validBefore: number;
  nonce: Uint8Array;
  v: number;
  r: string;
  s: string;
}
