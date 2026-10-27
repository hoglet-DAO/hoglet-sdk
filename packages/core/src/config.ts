export type HogletNetwork = "testnet" | "mainnet";

export interface ContractAddresses {
  readonly daoFactory: string;
  readonly daoRouter: string;
  readonly daoGenesis: string;
  readonly daoBoost: string;
  readonly daoLibs: string;
  readonly daoTokens: string;
  readonly daoScripts: string;
  readonly daoViews: string;
  readonly taxRouter: string;
  readonly launcher: string;
  readonly ammRouter: string;
  readonly wsup: string;
  readonly vault: string;
  readonly multisigV2: string;
  readonly multisigLegacy: string;
  readonly nftWrapper: string;
}

/**
 * Deployed contract addresses. They are IDENTICAL on testnet and mainnet
 * by design. Only endpoints (RPC/API/chain id) change per network.
 */
export const CONTRACTS: ContractAddresses = Object.freeze({
  daoFactory: "0xe7ebc7fa1e5d6ce8a102780dd22577a5f8bc9cdb9de7c9fb250176b017f25fcd",
  daoRouter: "0x81d6612bb40d99e79fa99114a82953a3a19971b37b147ea269ce4a535288fbb8",
  daoGenesis: "0x7ea1513782150d8c19896dd9da91215d7b81d10ad4c0ae1467167b6c8834d037",
  daoBoost: "0x0893f46752ea8ee1416cf061c2f0ffd4ff538020630731c4e96074f3d64e0107",
  daoLibs: "0xc91177c0c283292d8de2a1be69926d904d055bc8ae758a2a2958e7508121a30e",
  daoTokens: "0x195047fcb6bb4c2918ab5c61e08a777a575bc2f32116bfc40bbed49c04a13bf8",
  daoScripts: "0x739eb15a8beb2660db940041b5c29e96270feb2ee77eecb023877f22cee977e9",
  daoViews: "0xf3f3650ace9d98102b7023c61c1f6c5a698008ded9662585faf069c4810cb24e",
  taxRouter: "0x74329c1fd2d57b2a902f737b5ad71b4610214635de74b8dbeb82be9b1a985493",
  launcher: "0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885",
  ammRouter: "0x3045d27b5fada1e30897a741fb184e48ef0bff3717aea23918ebc1e5c7153083",
  wsup: "0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43",
  vault: "0x06dc465fc9c70df95df1e1c0b1fb44d72d70a2f0479dd8ee8158e79e8a6f171a",
  multisigV2: "0xe7572de52f8b92f88b7164558369cf1da822dc0842b652364d7278999cdcd64c",
  multisigLegacy: "0x5d7f79da44885dfd543f81139cff25fb43121e7ae03ebd720f9ac9e6449dd1a5",
  nftWrapper: "0x2926688850d36e736b1b80bdafaafffba51da5e8cac98d721380e70f0f568d56",
});

export interface NetworkEndpoints {
  readonly chainId: number;
  readonly rpcV1: string;
  readonly rpcV3: string;
  readonly apiBase: string;
  readonly indexApiBase: string;
  readonly explorer: string;
}

export const NETWORKS: Record<HogletNetwork, NetworkEndpoints> = {
  testnet: {
    chainId: 6,
    rpcV1: "https://rpc-testnet.supra.com/rpc/v1",
    rpcV3: "https://rpc-testnet.supra.com/rpc/v3",
    apiBase: "https://testnet-dao-api.hoglet.xyz",
    indexApiBase: "https://testnet-dao-api.hoglet.xyz",
    explorer: "https://testnet.suprascan.io",
  },
  mainnet: {
    chainId: 8,
    rpcV1: "https://rpc-mainnet.supra.com/rpc/v1",
    rpcV3: "https://rpc-mainnet.supra.com/rpc/v3",
    apiBase: "https://dao-api.hoglet.xyz",
    indexApiBase: "https://daos.hoglet.xyz",
    explorer: "https://suprascan.io",
  },
};

export interface HogletConfig extends NetworkEndpoints {
  readonly network: HogletNetwork;
  readonly contracts: ContractAddresses;
  readonly dataApiBase: string;
  readonly launcherApiBase: string;
  readonly swapApiBase: string;
}

export interface HogletConfigOverrides {
  network?: HogletNetwork | string;
  rpcV1?: string;
  rpcV3?: string;
  apiBase?: string;
  indexApiBase?: string;
  dataApiBase?: string;
  launcherApiBase?: string;
  swapApiBase?: string;
  contracts?: Partial<ContractAddresses>;
}

export const DATA_API_BASE = "https://api.hoglet.xyz";
export const LAUNCHER_API_BASE = "https://launch.hoglet.xyz/api";
export const SWAP_API_BASE = "https://swap.hoglet.xyz";

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

  const indexApiBase = (
    overrides.indexApiBase ??
    env("HOGLET_INDEX_API") ??
    base.indexApiBase
  ).replace(/\/+$/, "");

  const dataApiBase = (
    overrides.dataApiBase ??
    env("HOGLET_DATA_API") ??
    DATA_API_BASE
  ).replace(/\/+$/, "");

  const launcherApiBase = (
    overrides.launcherApiBase ??
    env("HOGLET_LAUNCHER_API") ??
    LAUNCHER_API_BASE
  ).replace(/\/+$/, "");

  const swapApiBase = (
    overrides.swapApiBase ??
    env("HOGLET_SWAP_API") ??
    SWAP_API_BASE
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
    daoBoost: assertAddress(
      "daoBoost",
      overrides.contracts?.daoBoost ?? env("HOGLET_DAO_BOOST") ?? CONTRACTS.daoBoost,
    ),
    daoLibs: assertAddress(
      "daoLibs",
      overrides.contracts?.daoLibs ?? env("HOGLET_DAO_LIBS") ?? CONTRACTS.daoLibs,
    ),
    daoTokens: assertAddress(
      "daoTokens",
      overrides.contracts?.daoTokens ?? env("HOGLET_DAO_TOKENS") ?? CONTRACTS.daoTokens,
    ),
    daoScripts: assertAddress(
      "daoScripts",
      overrides.contracts?.daoScripts ?? env("HOGLET_DAO_SCRIPTS") ?? CONTRACTS.daoScripts,
    ),
    daoViews: assertAddress(
      "daoViews",
      overrides.contracts?.daoViews ?? env("HOGLET_DAO_VIEWS") ?? CONTRACTS.daoViews,
    ),
    taxRouter: assertAddress(
      "taxRouter",
      overrides.contracts?.taxRouter ?? env("HOGLET_TAX_ROUTER") ?? CONTRACTS.taxRouter,
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
    vault: assertAddress(
      "vault",
      overrides.contracts?.vault ?? env("HOGLET_VAULT") ?? CONTRACTS.vault,
    ),
    multisigV2: assertAddress(
      "multisigV2",
      overrides.contracts?.multisigV2 ??
        env("HOGLET_MULTISIG_V2") ??
        CONTRACTS.multisigV2,
    ),
    multisigLegacy: assertAddress(
      "multisigLegacy",
      overrides.contracts?.multisigLegacy ??
        env("HOGLET_MULTISIG_LEGACY") ??
        CONTRACTS.multisigLegacy,
    ),
    nftWrapper: assertAddress(
      "nftWrapper",
      overrides.contracts?.nftWrapper ??
        env("HOGLET_NFT_WRAPPER") ??
        CONTRACTS.nftWrapper,
    ),
  };

  return {
    network,
    chainId: base.chainId,
    rpcV1,
    rpcV3,
    apiBase,
    indexApiBase,
    dataApiBase,
    launcherApiBase,
    swapApiBase,
    explorer: base.explorer,
    contracts,
  };
}
