import { resolveConfig, type HogletConfig } from "./config.js";
import { RpcClient } from "./rpc.js";
import { ApiClient } from "./api.js";
import { asBigInt, fromRaw, pow10 } from "./format.js";
import { sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import type {
  AmmQuote,
  ApiDao,
  CurveProgress,
  DaoInfo,
  DaoStatus,
  DaoStatusKind,
  EpochInfo,
  GaugeInfo,
  PoolState,
  ProposalDetails,
  TokenMetadata,
  TradingPhaseInfo,
  VeInfo,
} from "./types.js";

const EPOCH_SECONDS = 604_800;
const METADATA_RESOURCE = "0x1::fungible_asset::Metadata";
const STORE_RESOURCE = "0x1::fungible_asset::FungibleStore";

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function optionAddress(value: unknown): string | null {
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

function poolObject(address: string): { inner: string } {
  return { inner: address };
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

export class HogletReader {
  readonly config: HogletConfig;
  private readonly rpc: RpcClient;
  private readonly api: ApiClient;
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

  private factory(module: string, fn: string): string {
    return `${this.config.contracts.daoFactory}::${module}::${fn}`;
  }

  private router(module: string, fn: string): string {
    return `${this.config.contracts.daoRouter}::${module}::${fn}`;
  }

  private launcher(module: string, fn: string): string {
    return `${this.config.contracts.launcher}::${module}::${fn}`;
  }

  private amm(module: string, fn: string): string {
    return `${this.config.contracts.ammRouter}::${module}::${fn}`;
  }

  private async viewOne<T = unknown>(
    functionId: string,
    args: unknown[] = [],
    typeArguments: string[] = [],
  ): Promise<T | undefined> {
    const result = await this.rpc.view<T>(functionId, args, typeArguments);
    return result[0];
  }

  private async safeViewOne<T = unknown>(
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

  // -------------------------------------------------------------------------
  // Tokens & metadata
  // -------------------------------------------------------------------------

  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    let queried = address;
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

  // -------------------------------------------------------------------------
  // DAO discovery & status
  // -------------------------------------------------------------------------

  async getDaoForToken(tokenAddress: string): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.factory("petra", "get_dao_for_token"),
      [tokenAddress],
    );
    return optionAddress(raw);
  }

  async getCurator(): Promise<string | null> {
    const raw = await this.safeViewOne(this.factory("petra", "get_curator"), []);
    return raw ? asString(raw) : null;
  }

  async getDaoStatus(daoAddress: string): Promise<DaoStatus> {
    // `charter::is_active` aborts when the address has no DaoConfig. Use it as
    // the existence probe so a plain token address is never misreported as a
    // static DAO under curatorship.
    let active: boolean | undefined;
    try {
      active = await this.viewOne<boolean>(this.factory("charter", "is_active"), [
        daoAddress,
      ]);
    } catch {
      const curator = await this.getCurator();
      return {
        daoAddress,
        isActive: null,
        isBlessed: null,
        isInflationary: null,
        status: "unknown",
        guardian: null,
        curator,
        note: "No DaoConfig found for this address (not a Hoglet DAO).",
      };
    }

    const [blessed, inflationary, guardianRaw, curator] = await Promise.all([
      this.safeViewOne<boolean>(this.factory("charter", "is_blessed"), [daoAddress]),
      this.safeViewOne<boolean>(this.factory("charter", "is_inflationary"), [
        daoAddress,
      ]),
      this.safeViewOne(this.factory("charter", "get_guardian"), [daoAddress]),
      this.getCurator(),
    ]);

    const guardian = optionAddress(guardianRaw);
    let status: DaoStatusKind = "unknown";
    let note = "No DaoConfig found for this address.";

    if (inflationary === true) {
      status = "inflationary";
      note = "Inflationary ve(3,3) DAO (gauges, emissions and bribes enabled).";
    } else if (inflationary === false && blessed === true) {
      status = "static_blessed";
      note = "Static DAO blessed by the curator. Full governance enabled.";
    } else if (inflationary === false && blessed === false) {
      status = "static_under_curatorship";
      note =
        "Static DAO under curatorship: treasury/NFT proposals work, but config, guardian and script changes require blessing (charter::bless_dao).";
    }

    return {
      daoAddress,
      isActive: typeof active === "boolean" ? active : null,
      isBlessed: typeof blessed === "boolean" ? blessed : null,
      isInflationary: typeof inflationary === "boolean" ? inflationary : null,
      status,
      guardian,
      curator,
      note,
    };
  }

  async listDaos(): Promise<ApiDao[]> {
    return this.api.getDaos();
  }

  async getDao(tokenAddress: string): Promise<DaoInfo | null> {
    const daoAddress = await this.getDaoForToken(tokenAddress);
    if (!daoAddress) return null;

    const [metadata, status, apiDaos] = await Promise.all([
      this.getTokenMetadata(tokenAddress),
      this.getDaoStatus(daoAddress),
      this.api.getDaos(),
    ]);
    const apiDao = apiDaos.find(
      (d) => d.daoAddress?.toLowerCase() === daoAddress.toLowerCase(),
    );

    if (!metadata) return null;
    return {
      daoAddress,
      tokenAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      status,
      creatorAddress: apiDao?.creatorAddress ?? null,
      totalValueLocked: apiDao?.totalValueLocked ?? null,
      isPaused: apiDao?.isPaused ?? null,
    };
  }

  // -------------------------------------------------------------------------
  // Gauges
  // -------------------------------------------------------------------------

  async getGauges(daoAddress: string, epoch?: number): Promise<GaugeInfo[]> {
    const countRaw = await this.safeViewOne(
      this.factory("zeal", "get_gauge_count"),
      [daoAddress],
    );
    const count = asNumber(countRaw ?? 0);
    if (count <= 0) return [];

    const targetEpoch = epoch ?? this.getEpochInfo().currentEpoch;
    const ids = Array.from({ length: count }, (_, index) => index);

    const gauges = await Promise.all(
      ids.map(async (gaugeId): Promise<GaugeInfo | null> => {
        const [destinationRaw, activeRaw, votesRaw] = await Promise.all([
          this.safeViewOne(this.factory("zeal", "get_gauge_destination"), [
            daoAddress,
            String(gaugeId),
          ]),
          this.safeViewOne(this.factory("zeal", "is_gauge_active"), [
            daoAddress,
            String(gaugeId),
          ]),
          this.safeViewOne(this.factory("zeal", "get_gauge_total_votes"), [
            daoAddress,
            String(targetEpoch),
            String(gaugeId),
          ]),
        ]);

        const destination = asString(destinationRaw);
        if (!destination || destination.toLowerCase() === "0x0") return null;

        const stakingTokenRaw = await this.safeViewOne(
          this.factory("foundry", "staking_token"),
          [destination],
        );
        const stakingToken = stakingTokenRaw ? asString(stakingTokenRaw) : null;
        const metadata = stakingToken
          ? await this.getTokenMetadata(stakingToken).catch(() => null)
          : null;

        return {
          gaugeId,
          destination,
          stakingToken,
          poolAddress: stakingToken,
          symbol: metadata?.symbol ?? null,
          totalVotes: asString(votesRaw ?? "0"),
          isActive: activeRaw === true,
        };
      }),
    );

    return gauges.filter((gauge): gauge is GaugeInfo => gauge !== null);
  }

  async isGaugeActive(daoAddress: string, gaugeId: number): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.factory("zeal", "is_gauge_active"),
      [daoAddress, String(gaugeId)],
    );
    return raw === true;
  }

  // -------------------------------------------------------------------------
  // Launcher / trading phase / quotes
  // -------------------------------------------------------------------------

  async getLauncherResourceAddress(): Promise<string | null> {
    if (this.launcherResource) return this.launcherResource;
    const raw = await this.safeViewOne(
      this.launcher("launch_config", "get_resource_address"),
      [],
    );
    if (!raw) return null;
    this.launcherResource = asString(raw);
    return this.launcherResource;
  }

  async isLauncherProject(tokenAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.launcher("hoglet_core", "is_launcher_project"),
      [tokenAddress],
    );
    return raw === true;
  }

  /** Full bonding-curve pool state (single view) + derived pool address. */
  async getPoolState(tokenAddress: string): Promise<PoolState | null> {
    if (!(await this.isLauncherProject(tokenAddress))) return null;

    const raw = await this.safeViewOne<Record<string, unknown>>(
      this.launcher("hoglet_core", "get_pool_state"),
      [tokenAddress],
    );
    if (!raw) return null;

    const resource = await this.getLauncherResourceAddress();
    const poolAddress = resource
      ? derivePoolAddress(resource, tokenAddress)
      : null;
    const quoteMetadata = asString(raw.quote_metadata ?? "0x0");

    return {
      tokenAddress,
      poolAddress,
      quoteMetadata:
        !quoteMetadata || quoteMetadata.toLowerCase() === "0x0"
          ? null
          : quoteMetadata,
      virtualTokenReserves: asString(raw.virtual_token_reserves ?? "0"),
      virtualQuoteReserves: asString(raw.virtual_quote_reserves ?? "0"),
      isCompleted: raw.is_completed === true,
      isMigrated: raw.is_migrated_to_dex === true,
      targetThreshold: asString(raw.target_threshold ?? "0"),
      devAddress: asString(raw.dev_address ?? ""),
    };
  }

  async getPoolAddress(tokenAddress: string): Promise<string | null> {
    const state = await this.getPoolState(tokenAddress);
    return state?.poolAddress ?? null;
  }

  /** Quote token (FA metadata) used by a bonding-curve pool. */
  async getPoolQuote(tokenAddress: string): Promise<TokenMetadata | null> {
    const state = await this.getPoolState(tokenAddress);
    if (!state?.quoteMetadata) return null;
    return this.getTokenMetadata(state.quoteMetadata).catch(() => null);
  }

  async getCurveProgress(tokenAddress: string): Promise<CurveProgress | null> {
    const state = await this.getPoolState(tokenAddress);
    if (!state) return null;

    // `get_bonding_curve_progress_data` returns a Move tuple, which the view
    // RPC flattens into the result array (not result[0]).
    const tuple = await this.rpc.view<unknown>(
      this.launcher("hoglet_core", "get_bonding_curve_progress_data"),
      [tokenAddress],
    );
    const raised = asBigInt(tuple[0] ?? 0);
    const target = asBigInt(tuple[1] ?? state.targetThreshold);
    const completed = tuple[2] === true || state.isCompleted;

    const quote = state.quoteMetadata
      ? await this.getTokenMetadata(state.quoteMetadata).catch(() => null)
      : null;
    const decimals = quote?.decimals ?? 8;
    const percent =
      target > 0n
        ? Math.min(100, Number((raised * 10_000n) / target) / 100)
        : 0;

    return {
      poolAddress: state.poolAddress ?? "",
      quoteSymbol: quote?.symbol ?? null,
      quoteDecimals: decimals,
      raisedQuoteRaw: raised.toString(),
      targetQuoteRaw: target.toString(),
      raisedQuote: fromRaw(raised, decimals),
      targetQuote: fromRaw(target, decimals),
      percentComplete: percent,
      completed,
      migrated: state.isMigrated,
    };
  }

  async getTradingPhase(tokenAddress: string): Promise<TradingPhaseInfo> {
    const [daoAddress, state] = await Promise.all([
      this.getDaoForToken(tokenAddress),
      this.getPoolState(tokenAddress),
    ]);

    if (!state) {
      return {
        phase: daoAddress ? "governance-only" : "unknown",
        tokenAddress,
        daoAddress,
        poolAddress: null,
        note: daoAddress
          ? "No launchpad pool: heritage/static token. Use the DAO governance flows."
          : "No launchpad pool and no DAO for this token.",
      };
    }

    if (state.isMigrated) {
      return {
        phase: "amm",
        tokenAddress,
        daoAddress,
        poolAddress: state.poolAddress,
        note: "Post-migration: trade via the AMM router.",
      };
    }
    if (state.isCompleted) {
      return {
        phase: "migrating",
        tokenAddress,
        daoAddress,
        poolAddress: state.poolAddress,
        note: "Curve filled but AMM liquidity not seeded yet. No trading.",
      };
    }
    return {
      phase: "curve",
      tokenAddress,
      daoAddress,
      poolAddress: state.poolAddress,
      note: "Bonding curve open. Buy via hoglet_core::buy_tokens.",
    };
  }

  /**
   * Quotes tokens out for a given quote-token amount (the launcher supports
   * multiple quote tokens, so the amount is denominated in the pool quote).
   */
  async quoteCurveBuy(
    tokenAddress: string,
    quoteAmountRaw: string,
  ): Promise<{ tokensOutRaw: string; metadata: TokenMetadata | null }> {
    if (!(await this.isLauncherProject(tokenAddress))) {
      throw new Error(
        "Token is not a launchpad project (no bonding curve pool)",
      );
    }
    const out = await this.viewOne(
      this.launcher("hoglet_core", "buy_quote_amount"),
      [tokenAddress, quoteAmountRaw],
    );
    if (out === undefined) throw new Error("Curve quote failed");
    return {
      tokensOutRaw: asString(out),
      metadata: await this.getTokenMetadata(tokenAddress).catch(() => null),
    };
  }

  async quoteAmmBuy(
    outputToken: string,
    amountInRaw: string,
    inputToken?: string,
  ): Promise<AmmQuote> {
    const input = inputToken ?? this.config.contracts.wsup;
    const path = [input, outputToken];
    const [outMeta, inMeta] = await Promise.all([
      this.getTokenMetadata(outputToken).catch(() => null),
      this.getTokenMetadata(input).catch(() => null),
    ]);
    const inDecimals = inMeta?.decimals ?? 8;
    const outDecimals = outMeta?.decimals ?? 8;

    const raw = await this.viewOne(
      this.amm("amm_router", "get_amounts_out"),
      [amountInRaw, path.map(poolObject)],
    );
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error("No route or empty AMM quote");
    }
    const amountOutRaw = asString(raw[raw.length - 1]);

    let priceImpactPct: number | null = null;
    try {
      const referenceIn = pow10(inDecimals).toString();
      const ref = await this.viewOne(
        this.amm("amm_router", "get_amounts_out"),
        [referenceIn, path.map(poolObject)],
      );
      if (Array.isArray(ref) && ref.length > 0) {
        const refOut = asString(ref[ref.length - 1]);
        const rateActual = Number(amountOutRaw) / Number(amountInRaw);
        const rateRef = Number(refOut) / Number(referenceIn);
        if (rateRef > 0) {
          priceImpactPct = Math.min(((rateActual - rateRef) / rateRef) * 100, 0);
        }
      }
    } catch {
      // impact is optional
    }

    let warning: string | undefined;
    if (priceImpactPct !== null && priceImpactPct <= -25) {
      warning = "CRITICAL price impact: thin liquidity. Require explicit user consent.";
    } else if (priceImpactPct !== null && priceImpactPct <= -10) {
      warning = "Moderate price impact.";
    }

    return {
      path,
      amountInRaw,
      amountOutRaw,
      amountOut: fromRaw(amountOutRaw, outDecimals),
      inputSymbol: inMeta?.symbol ?? null,
      outputSymbol: outMeta?.symbol ?? null,
      inputDecimals: inDecimals,
      outputDecimals: outDecimals,
      priceImpactPct:
        priceImpactPct === null ? null : Number(priceImpactPct.toFixed(4)),
      warning,
    };
  }

  // -------------------------------------------------------------------------
  // Governance reads
  // -------------------------------------------------------------------------

  async getProposalDetails(
    daoAddress: string,
    proposalId: string | number,
  ): Promise<ProposalDetails> {
    const result = await this.rpc.view<unknown>(
      this.factory("ledger", "get_proposal_details"),
      [daoAddress, String(proposalId)],
    );
    return {
      proposer: asString(result[0]),
      startTime: asString(result[1]),
      endTime: asString(result[2]),
      eta: asString(result[3]),
      executed: result[4] === true,
      canceled: result[5] === true,
      forVotes: asString(result[6] ?? "0"),
      againstVotes: asString(result[7] ?? "0"),
      abstainVotes: asString(result[8] ?? "0"),
    };
  }

  async getProposalState(
    daoAddress: string,
    proposalId: string | number,
  ): Promise<number> {
    const raw = await this.viewOne(
      this.factory("ledger", "get_proposal_state"),
      [daoAddress, String(proposalId)],
    );
    return asNumber(raw ?? 0);
  }

  async getTotalLocked(daoAddress: string): Promise<string> {
    const raw = await this.safeViewOne(
      this.factory("legacy", "get_total_locked"),
      [daoAddress],
    );
    return asString(raw ?? "0");
  }

  async getVotingPowerAt(
    veTokenAddress: string,
    epoch: string | number,
  ): Promise<string> {
    const raw = await this.safeViewOne(
      this.factory("legacy", "get_voting_power_at"),
      [veTokenAddress, String(epoch)],
    );
    return asString(raw ?? "0");
  }

  async getVeInfo(
    veTokenAddress: string,
    daoAddress: string,
  ): Promise<VeInfo> {
    const result = await this.rpc.view<unknown>(
      this.factory("legacy", "ve_info"),
      [veTokenAddress, daoAddress],
    );
    return {
      exists: result[0] === true,
      lockedAmount: asString(result[1] ?? "0"),
      endEpoch: asString(result[2] ?? "0"),
      isDelegated: result[3] === true,
    };
  }

  async getCreationFee(): Promise<string> {
    const raw = await this.viewOne(this.factory("petra", "get_creation_fee"), []);
    return asString(raw ?? "0");
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
