/**
 * Human-readable Move abort helpers.
 *
 * Supra/Aptos encode the abort code in the "sub status" (e.g. 65541 = 0x10005
 * means abort code 5). We keep the raw status too because module error codes
 * are reused across modules (E_* constants are per module).
 */

export const COMMON_ABORT_CODES: Record<number, string> = {
  1: "Unauthorized / invalid argument",
  2: "Invalid argument",
  3: "Invalid state",
  4: "Not found",
  5: "E_DAO_ALREADY_EXISTS (the token already has a DAO)",
  6: "Already exists",
  19: "E_NOT_BLESSED (static DAO still under curatorship)",
  30: "E_ALREADY_BLESSED (DAO is already blessed)",
  31: "E_SMART_TOKEN_NOT_SUPPORTED_FOR_STATIC_DAO (use the wrapper flow)",
  2000: "Insufficient balance / amount mismatch",
};

function extractStatus(message: string): number | null {
  const sub = message.match(/sub status\s+(\d+)/i);
  if (sub) return Number(sub[1]);
  const abort = message.match(/abort(?:ed)?[^\d]*(\d+)/i);
  if (abort) return Number(abort[1]);
  return null;
}

export function describeMoveError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status = extractStatus(message);
  if (status === null) return message;

  const code = status & 0xffff;
  const label = COMMON_ABORT_CODES[code];
  return label
    ? `${message} (abort ${code}: ${label})`
    : `${message} (abort ${code})`;
}
