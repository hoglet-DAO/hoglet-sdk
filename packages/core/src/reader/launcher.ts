import { ReaderContext, asString, derivePoolAddress } from "./context.js";
import { asBigInt, fromRaw } from "../format.js";
import type {
  CurvePrice,
  CurveProgress,
  CurveSellQuote,
  HodlPoolStats,
  PoolState,
  TokenMetadata,
  TradingPhaseInfo,
  UserStakeInfo,
} from "../types.js";

export class LauncherReader extends ReaderContext {
  async getLauncherResourceAddress(): Promise<string | null> {
    const cached = this.getLauncherResource();
    if (cached) return cached;
    const raw = await this.safeViewOne(
      this.launcherFn("launch_config", "get_resource_address"),
      [],
    );
    if (!raw) return null;
    const resource = asString(raw);
    this.setLauncherResource(resource);
    return resource;
  }

  async isLauncherProject(tokenAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.launcherFn("hoglet_core", "is_launcher_project"),
      [tokenAddress],
    );
    return raw === true;
  }

  /** Full bonding-curve pool state (single view) + derived pool address. */
  async getPoolState(tokenAddress: string): Promise<PoolState | null> {
    if (!(await this.isLauncherProject(tokenAddress))) return null;

    const raw = await this.safeViewOne<Record<string, unknown>>(
      this.launcherFn("hoglet_core", "get_pool_state"),
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
      this.launcherFn("hoglet_core", "get_bonding_curve_progress_data"),
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
      this.launcherFn("hoglet_core", "buy_quote_amount"),
      [tokenAddress, quoteAmountRaw],
    );
    if (out === undefined) throw new Error("Curve quote failed");
    return {
      tokensOutRaw: asString(out),
      metadata: await this.getTokenMetadata(tokenAddress).catch(() => null),
    };
  }

  /** Quote cost in quote-token raw units for an exact token amount (pre-fee). */
  async quoteCurveExactTokens(
    tokenAddress: string,
    tokensOutRaw: string,
  ): Promise<{ quoteInRaw: string; metadata: TokenMetadata | null }> {
    if (!(await this.isLauncherProject(tokenAddress))) {
      throw new Error(
        "Token is not a launchpad project (no bonding curve pool)",
      );
    }
    const out = await this.viewOne(
      this.launcherFn("hoglet_core", "buy_token_amount"),
      [tokenAddress, tokensOutRaw],
    );
    if (out === undefined) throw new Error("Curve exact-buy quote failed");
    return {
      quoteInRaw: asString(out),
      metadata: await this.getPoolQuote(tokenAddress).catch(() => null),
    };
  }

  /** Quote quote-token raw units out for selling tokens (pre-fee). */
  async quoteCurveSell(
    tokenAddress: string,
    tokensInRaw: string,
  ): Promise<CurveSellQuote> {
    if (!(await this.isLauncherProject(tokenAddress))) {
      throw new Error(
        "Token is not a launchpad project (no bonding curve pool)",
      );
    }
    const out = await this.viewOne(
      this.launcherFn("hoglet_core", "sell_token"),
      [tokenAddress, tokensInRaw],
    );
    if (out === undefined) throw new Error("Curve sell quote failed");
    return {
      quoteOutRaw: asString(out),
      metadata: await this.getPoolQuote(tokenAddress).catch(() => null),
    };
  }

  /** Spot price expressed in quote raw units per whole token (scaled 1e8 on-chain). */
  async getCurrentPrice(tokenAddress: string): Promise<CurvePrice | null> {
    const state = await this.getPoolState(tokenAddress);
    if (!state) return null;
    const raw = await this.safeViewOne(
      this.launcherFn("hoglet_core", "get_current_price"),
      [tokenAddress],
    );
    if (raw === undefined) return null;
    const quote = state.quoteMetadata
      ? await this.getTokenMetadata(state.quoteMetadata).catch(() => null)
      : null;
    const priceRaw = asString(raw);
    return {
      tokenAddress,
      priceRaw,
      price: fromRaw(priceRaw, quote?.decimals ?? 8),
    };
  }

  /** HODL staking position of a user in a launched token. */
  async getUserStakeInfo(
    tokenAddress: string,
    user: string,
  ): Promise<UserStakeInfo | null> {
    if (!(await this.isLauncherProject(tokenAddress))) return null;
    const result = await this.rpc.view<unknown>(
      this.launcherFn("hoglet_core", "get_user_stake_info"),
      [tokenAddress, user],
    );
    if (result.length < 2) return null;
    return {
      tokenAddress,
      user,
      unlockedRaw: asString(result[0] ?? "0"),
      stakedRaw: asString(result[1] ?? "0"),
    };
  }

  /** Total staked vs total supply for a launched token's HODL pool. */
  async getHodlPoolStats(
    tokenAddress: string,
  ): Promise<HodlPoolStats | null> {
    if (!(await this.isLauncherProject(tokenAddress))) return null;
    const result = await this.rpc.view<unknown>(
      this.launcherFn("hoglet_core", "get_hodl_pool_stats"),
      [tokenAddress],
    );
    if (result.length < 2) return null;
    return {
      tokenAddress,
      totalStakedRaw: asString(result[0] ?? "0"),
      totalSupplyRaw: asString(result[1] ?? "0"),
    };
  }

}
