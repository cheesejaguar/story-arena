import type { Slot } from "./randomize-slots";

/**
 * NDJSON events emitted by POST /api/runs. Shared by the route handler and
 * the client so the wire format cannot drift.
 */
export type RunStreamEvent =
  | { type: "init"; runId: string; replay?: boolean }
  | { type: "slot_delta"; slot: Slot; text: string }
  | { type: "slot_done"; slot: Slot }
  | { type: "slot_error"; slot: Slot; error?: string }
  | {
      type: "done";
      runId: string;
      redirectTo: string;
      replay?: boolean;
    }
  | { type: "error"; error: string; code?: string };
