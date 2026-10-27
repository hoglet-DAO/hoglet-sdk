import { TxBuilderBase } from "./base.js";
import { address, u64, type TxPayload } from "../payload.js";

const DEFAULT_DEADLINE_SECONDS = 20 * 60;

function deadlineArg(value?: string | number | bigint): string {
  if (value !== undefined) return u64(value);
  return String(Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS);
}

export interface ZapBuyLockParams {
  /** Governance token FA metadata address (native or wrapped). */
  govToken: string;
  /** Input amount in raw base units. */
  amount: string | number | bigint;
  minAmountOut: string | number | bigint;
  /**
   * AMM path. For `buyAndLockCoin` the wrapped start is injected by the
   * router, so `[gov]` is typical. For FA it must be `[quote, ..., gov]`.
   */
  path: string[];
  lockEpochs: string | number | bigint;
  deadline?: string | number | bigint;
}

export interface ZapBuyLockCoinParams extends ZapBuyLockParams {
  /** Coin type paid, e.g. `0x1::supra_coin::SupraCoin`. */
  coinType: string;
}

/** `dao_router::dao_zap`: buy a governance token and lock it in one tx. */
export class ZapTx extends TxBuilderBase {
  /** Pay with any FA along `path` and lock the bought governance tokens. */
  buyAndLockFas(params: ZapBuyLockParams): TxPayload {
    if (params.path.length < 2) throw new Error("path needs at least 2 tokens");
    return this.router("dao_zap", "buy_and_lock_fa", [
      address(params.govToken),
      u64(params.amount),
      u64(params.minAmountOut),
      params.path.map(address),
      deadlineArg(params.deadline),
      u64(params.lockEpochs),
    ]);
  }

  /** Pay with a native Coin type and lock the bought governance tokens. */
  buyAndLockCoin(params: ZapBuyLockCoinParams): TxPayload {
    return this.router(
      "dao_zap",
      "buy_and_lock_coin",
      [
        address(params.govToken),
        u64(params.amount),
        u64(params.minAmountOut),
        params.path.map(address),
        deadlineArg(params.deadline),
        u64(params.lockEpochs),
      ],
      [params.coinType],
    );
  }
}
