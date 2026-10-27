const TEN = 10n;

export function pow10(decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 32) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }
  return TEN ** BigInt(decimals);
}

/** Converts a human amount ("12.5") to raw base units. Never uses Number. */
export function toRaw(human: string | number | bigint, decimals: number): string {
  if (typeof human === "bigint") return human.toString();
  const text = String(human).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) {
    throw new Error(`Invalid human amount: ${text}`);
  }
  const [integer, fraction = ""] = text.split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const raw = `${integer}${padded}`.replace(/^0+(?=\d)/, "");
  return BigInt(raw === "" ? "0" : raw).toString();
}

/** Converts raw base units to a human string without floating point loss. */
export function fromRaw(raw: string | number | bigint, decimals: number): string {
  const value = BigInt(raw);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = pow10(decimals);
  const integer = absolute / base;
  const fraction = (absolute % base).toString().padStart(decimals, "0");
  const trimmed = fraction.replace(/0+$/, "");
  const human = trimmed ? `${integer}.${trimmed}` : integer.toString();
  return negative ? `-${human}` : human;
}

export function asBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new Error(`Not an integer: ${value}`);
    return BigInt(value);
  }
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }
  throw new Error(`Cannot convert to bigint: ${String(value)}`);
}

/**
 * Encodes a UTF-8 string (or raw bytes) as a 0x-prefixed hex string, the wire
 * format Supra expects for `vector<u8>` arguments and view parameters.
 */
export function toBytesHex(value: string | Uint8Array): string {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/** Encodes a list of byte vectors (`vector<vector<u8>>`, e.g. package modules). */
export function toBytesHexList(values: Array<string | Uint8Array>): string[] {
  return values.map(toBytesHex);
}
