import { resolveConfig, type HogletConfig } from "../config.js";
import { RpcClient } from "../rpc.js";
import { ApiClient } from "../api/index.js";
import { sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import type { EpochInfo, TokenMetadata } from "../types.js";

export const EPOCH_SECONDS = 604_800;
const METADATA_RESOURCE = "0x1::fungible_asset::Metadata";
const STORE_RESOURCE = "0x1::fungible_asset::FungibleStore";

export function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function optionAddress(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    return value.toLowerCase() === "0x0" ? null : value;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? optionAddress(value[0]) : null;
  }
  if (typeof value === "object" && value !== null && "vec" in value) {
    const vec = (value as { vec?: unknown }).vec;
    return Array.isArray(vec) && vec.length > 0 ? optionAddress(vec[0]) : null;
  }
  return null;
}

export function poolObject(address: string): { inner: string } {
  return { inner: address };
}

export function isZeroAddress(value: string | null | undefined): boolean {
  if (!value) return true;
  const hex = value.replace(/^0x/i, "");
  return hex.length === 0 || /^0+$/.test(hex);
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const nested = (value as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as T[];
    const vec = (value as { vec?: unknown }).vec;
    if (Array.isArray(vec)) return vec as T[];
  }
  return [];
}

export function pick(
  source: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return undefined;
}

function addressBytes(address: string): Uint8Array {
  const hex = address.replace(/^0x/, "").padStart(64, "0").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(`Invalid address: ${address}`);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Deterministic pool address, mirroring `pool::get_pool_address`:
 * sha3_256(bcs(resource_address) || bcs(token_address) || 0xFE).
 */
export function derivePoolAddress(
  resourceAddress: string,
  tokenAddress: string,
): string {
  const resource = addressBytes(resourceAddress);
  const token = addressBytes(tokenAddress);
  const bytes = new Uint8Array(resource.length + token.length + 1);
  bytes.set(resource, 0);
  bytes.set(token, resource.length);
  bytes[bytes.length - 1] = 0xfe;
  return `0x${bytesToHex(sha3_256(bytes))}`;
}

/**
 * Shared state and primitives for every read module. Feature readers extend
 * this class, and `HogletReader` flattens their methods onto one instance.
 */
export class ReaderContext {
  readonly config: HogletConfig;
  protected readonly rpc: RpcClient;
  readonly api: ApiClient;
  private launcherResource: string | null = null;

  constructor(config: HogletConfig = resolveConfig()) {
    this.config = config;
    this.rpc = new RpcClient(config);
    this.api = new ApiClient(config);
  }

  get network(): HogletConfig["network"] {
    return this.config.network;
  }

  get contracts(): HogletConfig["contracts"] {
    return this.config.contracts;
  }

  get explorer(): string {
    return this.config.explorer;
  }

  protected factory(module: string, fn: string): string {
    return `${this.config.contracts.daoFactory}::${module}::${fn}`;
  }

  protected router(module: string, fn: string): string {
    return `${this.config.contracts.daoRouter}::${module}::${fn}`;
  }

  protected launcherFn(module: string, fn: string): string {
    return `${this.config.contracts.launcher}::${module}::${fn}`;
  }

  protected ammFn(module: string, fn: string): string {
    return `${this.config.contracts.ammRouter}::${module}::${fn}`;
  }

  protected vaultFn(module: string, fn: string): string {
    return `${this.config.contracts.vault}::${module}::${fn}`;
  }

  protected async viewOne<T = unknown>(
    functionId: string,
    args: unknown[] = [],
    typeArguments: string[] = [],
  ): Promise<T | undefined> {
    const result = await this.rpc.view<T>(functionId, args, typeArguments);
    return result[0];
  }

  protected async safeViewOne<T = unknown>(
    functionId: string,
    args: unknown[] = [],
    typeArguments: string[] = [],
  ): Promise<T | undefined> {
    try {
      return await this.viewOne<T>(functionId, args, typeArguments);
    } catch {
      return undefined;
    }
  }

  /** Reads a `vector<T>` view, tolerating both flat and nested RPC shapes. */
  protected async viewList<T = unknown>(
    functionId: string,
    args: unknown[] = [],
  ): Promise<T[]> {
    const result = await this.rpc.view<unknown>(functionId, args);
    if (result.length === 0) return [];
    if (result.length === 1) return asArray<T>(result[0]);
    return result as T[];
  }

  protected getLauncherResource(): string | null {
    return this.launcherResource;
  }

  protected setLauncherResource(value: string): void {
    this.launcherResource = value;
  }

  // -------------------------------------------------------------------------
  // Cross-cutting reads used by several feature modules
  // -------------------------------------------------------------------------

  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    const queried = address;
    let metaAddress = address;
    let data = await this.rpc.getResource<Record<string, unknown>>(
      address,
      METADATA_RESOURCE,
    );

    if (!data) {
      const store = await this.rpc.getResource<Record<string, unknown>>(
        address,
        STORE_RESOURCE,
      );
      const metadata = store?.metadata as { inner?: string } | string | undefined;
      const inner =
        typeof metadata === "string" ? metadata : metadata?.inner ?? undefined;
      if (!inner) return null;
      metaAddress = inner;
      data = await this.rpc.getResource<Record<string, unknown>>(
        metaAddress,
        METADATA_RESOURCE,
      );
    }

    if (!data || !data.symbol) return null;
    return {
      address: metaAddress,
      queriedAddress: queried,
      symbol: asString(data.symbol),
      name: asString(data.name),
      decimals: asNumber(data.decimals ?? 8),
      iconUri: data.icon_uri ? asString(data.icon_uri) : null,
    };
  }

  async getDaoForToken(tokenAddress: string): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.factory("petra", "get_dao_for_token"),
      [tokenAddress],
    );
    return optionAddress(raw);
  }

  getEpochInfo(): EpochInfo {
    const nowSec = Math.floor(Date.now() / 1000);
    const currentEpoch = Math.floor(nowSec / EPOCH_SECONDS);
    const nextEpochStartUnix = (currentEpoch + 1) * EPOCH_SECONDS;
    const secondsUntilNextEpoch = nextEpochStartUnix - nowSec;
    return {
      currentEpoch,
      nextEpochStartUnix,
      secondsUntilNextEpoch,
      hoursUntilNextEpoch: Math.floor(secondsUntilNextEpoch / 3600),
      votingOpen: secondsUntilNextEpoch > 86_400,
    };
  }
}
