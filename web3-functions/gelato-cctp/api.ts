import { GELATO_API, CIRCLE_API } from "../../src/cctp-sdk/constants";
import { CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";
import {
  IAttestation,
  AttesationState,
  IRelayRequestResponse,
  IRelayTaskStatusResponse,
  IRelayTaskStatus,
} from "./types";
import ky from "ky";

const getErrorMsg = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const getRelayTaskStatus = async (
  taskId: string
): Promise<IRelayTaskStatus | null> => {
  try {
    const { task } = (await ky
      .get(`${GELATO_API}/tasks/status/${taskId}`)
      .json()) as IRelayTaskStatusResponse;
    return task;
  } catch (e) {
    console.error("getRelayTaskStatus:", getErrorMsg(e));
    return null;
  }
};

export const getAttestation = async (
  messageHash: string
): Promise<string | null> => {
  try {
    const { status, attestation } = (await ky
      .get(`${CIRCLE_API}/attestations/${messageHash}`)
      .json()) as IAttestation;
    return status === AttesationState.Complete ? attestation : null;
  } catch (e) {
    console.error("getAttestation:", getErrorMsg(e));
    return null;
  }
};

export const postCallWithSyncFee = async (
  request: CallWithSyncFeeRequest
): Promise<string | null> => {
  try {
    const { taskId } = (await ky
      .post(`${GELATO_API}/relays/v2/call-with-sync-fee`, {
        json: { ...request, retries: 0 },
      })
      .json()) as IRelayRequestResponse;
    return taskId;
  } catch (e) {
    console.error("postCallWithSyncFee:", getErrorMsg(e));
    return null;
  }
};
