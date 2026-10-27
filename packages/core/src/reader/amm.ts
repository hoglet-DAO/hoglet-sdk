import { ReaderContext, asString, isZeroAddress, poolObject } from "./context.js";
import { fromRaw, pow10 } from "../format.js";
import type {
  AmmPairInfo,
  AmmQuote,
  AmmReserves,
  TokenMetadata,
} from "../types.js";

export class AmmReader extends ReaderContext {
  /** Quotes an exact-input swap along an explicit path (multi-hop supported). */
  async quoteAmmPath(
    path: string[],
    amountInRaw: string,
  ): Promise<AmmQuote> {
    if (path.length < 2) throw new Error("AMM path needs at least 2 tokens");
    const input = path[0]!;
    const output = path[path.length - 1]!;
    const [outMeta, inMeta] = await Promise.all([
      this.getTokenMetadata(output).catch(() => null),
      this.getTokenMetadata(input).catch(() => null),
    ]);
    const inDecimals = inMeta?.decimals ?? 8;
    const outDecimals = outMeta?.decimals ?? 8;

    const raw = await this.viewOne(
      this.ammFn("amm_router", "get_amounts_out"),
      [amountInRaw, path.map(poolObject)],
    );
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error("No route or empty AMM quote");
    }
    const amountOutRaw = asString(raw[raw.length - 1]);
    return this.buildQuote(
      path,
      amountInRaw,
      amountOutRaw,
      inMeta,
      outMeta,
      inDecimals,
      outDecimals,
    );
  }

  async quoteAmmBuy(
    outputToken: string,
    amountInRaw: string,
    inputToken?: string,
  ): Promise<AmmQuote> {
    const input = inputToken ?? this.config.contracts.wsup;
    return this.quoteAmmPath([input, outputToken], amountInRaw);
  }

  /** Exact-output quote: how much input is needed for `amountOutRaw`. */
  async quoteAmmExactOut(
    outputToken: string,
    amountOutRaw: string,
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
      this.ammFn("amm_router", "get_amounts_in"),
      [amountOutRaw, path.map(poolObject)],
    );
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error("No route or empty AMM quote");
    }
    const amountInRaw = asString(raw[0]);
    return this.buildQuote(
      path,
      amountInRaw,
      amountOutRaw,
      inMeta,
      outMeta,
      inDecimals,
      outDecimals,
      false,
    );
  }

  private async buildQuote(
    path: string[],
    amountInRaw: string,
    amountOutRaw: string,
    inMeta: TokenMetadata | null,
    outMeta: TokenMetadata | null,
    inDecimals: number,
    outDecimals: number,
    computeImpact = true,
  ): Promise<AmmQuote> {
    let priceImpactPct: number | null = null;
    if (computeImpact) {
      try {
        const referenceIn = pow10(inDecimals).toString();
        const ref = await this.viewOne(
          this.ammFn("amm_router", "get_amounts_out"),
          [referenceIn, path.map(poolObject)],
        );
        if (Array.isArray(ref) && ref.length > 0) {
          const refOut = asString(ref[ref.length - 1]);
          const rateActual = Number(amountOutRaw) / Number(amountInRaw);
          const rateRef = Number(refOut) / Number(referenceIn);
          if (rateRef > 0) {
            priceImpactPct = Math.min(
              ((rateActual - rateRef) / rateRef) * 100,
              0,
            );
          }
        }
      } catch {
        // impact is optional
      }
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

  async getAmmPair(tokenA: string, tokenB: string): Promise<AmmPairInfo> {
    const raw = await this.safeViewOne(
      this.ammFn("amm_factory", "get_pair"),
      [tokenA, tokenB],
    );
    const pairAddress = asString(raw);
    return {
      tokenA,
      tokenB,
      pairAddress: isZeroAddress(pairAddress) ? null : pairAddress,
    };
  }

  async getAmmReserves(
    tokenA: string,
    tokenB: string,
  ): Promise<AmmReserves | null> {
    const result = await this.rpc.view<unknown>(
      this.ammFn("amm_factory", "get_reserves"),
      [tokenA, tokenB],
    );
    if (result.length < 2) return null;
    return {
      tokenA,
      tokenB,
      reserveARaw: asString(result[0] ?? "0"),
      reserveBRaw: asString(result[1] ?? "0"),
    };
  }

  async getAmmPairs(start = 0, limit = 50): Promise<string[]> {
    return this.viewList<string>(
      this.ammFn("amm_factory", "all_pairs_paginated"),
      [String(start), String(limit)],
    );
  }
}
