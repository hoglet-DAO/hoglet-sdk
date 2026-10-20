export interface TxPayload {
  /** Fully qualified Move function, e.g. 0x…::petra::create_dao_static */
  function: string;
  typeArguments: string[];
  /** Arguments WITHOUT the signer (the wallet injects it as sender). */
  functionArguments: unknown[];
}

export type Bytes = string | Uint8Array;

export function u64(value: string | number | bigint): string {
  return String(value);
}

export function u8(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`Invalid u8: ${value}`);
  }
  return value;
}

export function address(value: string): string {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(value)) {
    throw new Error(`Invalid address: ${value}`);
  }
  return value;
}

export function addresses(values: string[]): string[] {
  return values.map(address);
}

export function u64Vector(values: Array<string | number | bigint>): string[] {
  return values.map((value) => String(value));
}
