export type HogletNetwork = "testnet" | "mainnet";

export interface ContractAddresses {
  readonly daoFactory: string;
  readonly daoRouter: string;
  readonly daoGenesis: string;
  readonly launcher: string;
  readonly ammRouter: string;
  readonly wsup: string;
}

/**
 * Deployed contract addresses. They are IDENTICAL on testnet and mainnet
 * by design. Only endpoints (RPC/API/chain id) change per network.
 */
export const CONTRACTS: ContractAddresses = Object.freeze({
  daoFactory: "0xe7ebc7fa1e5d6ce8a102780dd22577a5f8bc9cdb9de7c9fb250176b017f25fcd",
  daoRouter: "0x81d6612bb40d99e79fa99114a82953a3a19971b37b147ea269ce4a535288fbb8",
  daoGenesis: "0x7ea1513782150d8c19896dd9da91215d7b81d10ad4c0ae1467167b6c8834d037",
  launcher: "0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885",
  ammRouter: "0x3045d27b5fada1e30897a741fb184e48ef0bff3717aea23918ebc1e5c7153083",
  wsup: "0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43",
});

export interface NetworkEndpoints {
  readonly chainId: number;
  readonly rpcV1: string;
  readonly rpcV3: string;
  readonly apiBase: string;
  readonly explorer: string;
}

export const NETWORKS: Record<HogletNetwork, NetworkEndpoints> = {
  testnet: {
    chainId: 6,
    rpcV1: "https://rpc-testnet.supra.com/rpc/v1",
    rpcV3: "https://rpc-testnet.supra.com/rpc/v3",
    apiBase: "https://testnet-dao-api.hoglet.xyz",
    explorer: "https://testnet.suprascan.io",
  },
  mainnet: {
    chainId: 8,
    rpcV1: "https://rpc-mainnet.supra.com/rpc/v1",
    rpcV3: "https://rpc-mainnet.supra.com/rpc/v3",
    apiBase: "https://dao-api.hoglet.xyz",
    explorer: "https://suprascan.io",
  },
};

export interface HogletConfig extends NetworkEndpoints {
  readonly network: HogletNetwork;
  readonly contracts: ContractAddresses;
}

export interface HogletConfigOverrides {
  network?: HogletNetwork | string;
  rpcV1?: string;
  rpcV3?: string;
  apiBase?: string;
  contracts?: Partial<ContractAddresses>;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/;

export function isAddress(value: unknown): value is string {
  return typeof value === "string" && ADDRESS_RE.test(value);
}

export function assertAddress(label: string, value: unknown): string {
  if (!isAddress(value)) {
    throw new Error(`${label} is not a valid 0x address: ${String(value)}`);
  }
  return value;
}

export function normalizeNetwork(value: string): HogletNetwork {
  const v = value.trim().toLowerCase();
  if (v === "mainnet" || v === "main" || v === "8") return "mainnet";
  if (v === "testnet" || v === "test" || v === "6") return "testnet";
  throw new Error(`Unsupported Hoglet network "${value}" (expected testnet|mainnet)`);
}

function env(name: string): string | undefined {
  const value = typeof process !== "undefined" ? process.env[name] : undefined;
  return value && value.trim() ? value.trim() : undefined;
}

export function resolveNetwork(explicit?: string | null): HogletNetwork {
  const raw = explicit ?? env("HOGLET_NETWORK");
  return normalizeNetwork(raw && raw.trim() ? raw : "testnet");
}

function withRpcBase(base: string, version: "v1" | "v3"): string {
  const trimmed = base.replace(/\/+$/, "");
  if (/\/rpc\/v1$/.test(trimmed) || /\/rpc\/v3$/.test(trimmed)) {
    return trimmed.replace(/\/rpc\/v[13]$/, `/rpc/${version}`);
  }
  return `${trimmed}/rpc/${version}`;
}

export function resolveConfig(overrides: HogletConfigOverrides = {}): HogletConfig {
  const network = overrides.network
    ? normalizeNetwork(String(overrides.network))
    : resolveNetwork();

  const base = NETWORKS[network];
  const rpcBase = env("HOGLET_RPC_URL");
  const rpcV1 =
    overrides.rpcV1 ??
    env("HOGLET_RPC_V1") ??
    (rpcBase ? withRpcBase(rpcBase, "v1") : base.rpcV1);
  const rpcV3 =
    overrides.rpcV3 ??
    env("HOGLET_RPC_V3") ??
    (rpcBase ? withRpcBase(rpcBase, "v3") : base.rpcV3);
  const apiBase = (
    overrides.apiBase ??
    env("HOGLET_API_BASE") ??
    base.apiBase
  ).replace(/\/+$/, "");

  const contracts: ContractAddresses = {
    daoFactory: assertAddress(
      "daoFactory",
      overrides.contracts?.daoFactory ?? env("HOGLET_DAO_FACTORY") ?? CONTRACTS.daoFactory,
    ),
    daoRouter: assertAddress(
      "daoRouter",
      overrides.contracts?.daoRouter ?? env("HOGLET_DAO_ROUTER") ?? CONTRACTS.daoRouter,
    ),
    daoGenesis: assertAddress(
      "daoGenesis",
      overrides.contracts?.daoGenesis ?? env("HOGLET_DAO_GENESIS") ?? CONTRACTS.daoGenesis,
    ),
    launcher: assertAddress(
      "launcher",
      overrides.contracts?.launcher ?? env("HOGLET_LAUNCHER") ?? CONTRACTS.launcher,
    ),
    ammRouter: assertAddress(
      "ammRouter",
      overrides.contracts?.ammRouter ?? env("HOGLET_AMM_ROUTER") ?? CONTRACTS.ammRouter,
    ),
    wsup: assertAddress(
      "wsup",
      overrides.contracts?.wsup ?? env("HOGLET_WSUP") ?? CONTRACTS.wsup,
    ),
  };

  return {
    network,
    chainId: base.chainId,
    rpcV1,
    rpcV3,
    apiBase,
    explorer: base.explorer,
    contracts,
  };
}
