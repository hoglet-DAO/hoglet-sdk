import { TxBuilderBase } from "./base.js";
import { address, u64, type TxPayload } from "../payload.js";

export interface DeployTokenParams {
  raising: string | number | bigint;
  name: string;
  symbol: string;
  uri: string;
  quoteAddress: string;
  website?: string;
  description?: string;
  socials?: string;
  unstakePeriodSeconds?: string | number | bigint;
}

export interface DeployAndBuyTokenParams extends DeployTokenParams {
  quoteInAmount: string | number | bigint;
  minTokensOut: string | number | bigint;
}

export class LauncherTx extends TxBuilderBase {
  // -------------------------------------------------------------------------
  // Launcher (hoglet_core::*)
  // -------------------------------------------------------------------------

  /**
   * Deploys a new token on the bonding curve.
   *
   * The transaction does not return the token address; read it from the
   * deploy event or derive it with `HogletReader` before submitting.
   */
  deployToken(params: DeployTokenParams): TxPayload {
    return this.launcherFn("hoglet_core", "deploy", [
      u64(params.raising),
      params.name,
      params.symbol,
      params.uri,
      params.website ?? "",
      params.description ?? "",
      params.socials ?? "",
      address(params.quoteAddress),
      u64(params.unstakePeriodSeconds ?? 0),
    ]);
  }

  /** Deploys and buys in the same transaction (one signature). */
  deployAndBuyToken(params: DeployAndBuyTokenParams): TxPayload {
    return this.launcherFn("hoglet_core", "deploy_and_buy_for_exact_quote", [
      u64(params.raising),
      params.name,
      params.symbol,
      params.uri,
      params.website ?? "",
      params.description ?? "",
      params.socials ?? "",
      address(params.quoteAddress),
      u64(params.unstakePeriodSeconds ?? 0),
      u64(params.quoteInAmount),
      u64(params.minTokensOut),
    ]);
  }

  buyCurveTokens(
    tokenAddress: string,
    quoteInAmount: string | number | bigint,
    minTokensOut: string | number | bigint,
  ): TxPayload {
    return this.launcherFn("hoglet_core", "buy_tokens", [
      address(tokenAddress),
      u64(quoteInAmount),
      u64(minTokensOut),
    ]);
  }

  sellCurveTokens(
    tokenAddress: string,
    tokenAmount: string | number | bigint,
    minQuoteOut: string | number | bigint,
  ): TxPayload {
    return this.launcherFn("hoglet_core", "sell_tokens", [
      address(tokenAddress),
      u64(tokenAmount),
      u64(minQuoteOut),
    ]);
  }

  /** Exact-output buy; rejected on-chain for tax-aware quote tokens. */
  buyCurveTokensExact(
    tokenAddress: string,
    tokensOut: string | number | bigint,
    maxQuoteIn: string | number | bigint,
  ): TxPayload {
    return this.launcherFn("hoglet_core", "swap_quote_for_exact_tokens", [
      address(tokenAddress),
      u64(tokensOut),
      u64(maxQuoteIn),
    ]);
  }

  /** Seeds AMM liquidity once the curve is completed. Permissionless. */
  migrateToAmm(tokenAddress: string): TxPayload {
    return this.launcherFn("hoglet_core", "execute_migration", [
      address(tokenAddress),
    ]);
  }

  /** HODL stake; blocked on-chain after the bonding curve completes. */
  stakeLaunchedToken(
    tokenAddress: string,
    amount: string | number | bigint,
  ): TxPayload {
    return this.launcherFn("hoglet_core", "stake", [
      address(tokenAddress),
      u64(amount),
    ]);
  }

  unstakeLaunchedToken(
    tokenAddress: string,
    amount: string | number | bigint,
  ): TxPayload {
    return this.launcherFn("hoglet_core", "unstake", [
      address(tokenAddress),
      u64(amount),
    ]);
  }

  harvestLaunchedToken(tokenAddress: string): TxPayload {
    return this.launcherFn("hoglet_core", "harvest", [address(tokenAddress)]);
  }

  /** Turns the delayed meme DAO live once the HODL period has finished. */
  activateDelayedDao(tokenAddress: string): TxPayload {
    return this.launcherFn("hoglet_core", "activate_delayed_dao", [
      address(tokenAddress),
    ]);
  }

}
