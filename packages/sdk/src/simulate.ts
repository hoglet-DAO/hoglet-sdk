import type { HogletConfig } from "@hoglet/core";
import type { TxPayload } from "./payload.js";

export interface SimulationResult {
  success: boolean;
  raw: unknown;
}

/**
 * Experimental dry-run helper. The exact simulate route can differ between
 * Supra RPC versions; callers should treat failures as non-fatal and fall
 * back to read-only validation.
 */
export async function simulateEntryFunction(
  config: HogletConfig,
  sender: string,
  payload: TxPayload,
  timeoutMs = 12_000,
): Promise<SimulationResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${config.rpcV1}/transactions/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender,
        payload: {
          type: "entry_function_payload",
          function: payload.function,
          type_arguments: payload.typeArguments,
          arguments: payload.functionArguments,
        },
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    const raw = text ? JSON.parse(text) : {};
    return { success: response.ok, raw };
  } finally {
    clearTimeout(timer);
  }
}
