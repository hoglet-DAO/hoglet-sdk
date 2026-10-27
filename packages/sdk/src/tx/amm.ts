import { TxBuilderBase } from "./base.js";
import { address, u64, type TxPayload } from "../payload.js";

const DEFAULT_DEADLINE_SECONDS = 20 * 60;

function deadlineArg(value?: string | number | bigint): string {
  if (value !== undefined) return u64(value);
  return String(Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS);
}

export interface SwapExactParams {
  amountIn: string | number | bigint;
  minAmountOut: string | number | bigint;
  /** FA metadata addresses; supports multi-hop. */
  path: string[];
  /** Recipient of the output tokens. */
  to: string;
  deadline?: string | number | bigint;
}

export interface SwapExactOutParams {
  amountOut: string | number | bigint;
  maxAmountIn: string | number | bigint;
  path: string[];
  to: string;
  deadline?: string | number | bigint;
}

export interface AddLiquidityParams {
  tokenA: string;
  tokenB: string;
  amountADesired: string | number | bigint;
  amountBDesired: string | number | bigint;
  amountAMin: string | number | bigint;
  amountBMin: string | number | bigint;
  to: string;
  deadline?: string | number | bigint;
}

export interface AddLiquiditySupraParams {
  token: string;
  amountTokenDesired: string | number | bigint;
  amountTokenMin: string | number | bigint;
  amountSupraDesired: string | number | bigint;
  amountSupraMin: string | number | bigint;
  to: string;
  deadline?: string | number | bigint;
}

export interface RemoveLiquidityParams {
  tokenA: string;
  tokenB: string;
  liquidity: string | number | bigint;
  amountAMin: string | number | bigint;
  amountBMin: string | number | bigint;
  to: string;
  deadline?: string | number | bigint;
}

export interface RemoveLiquiditySupraParams {
  token: string;
  liquidity: string | number | bigint;
  amountTokenMin: string | number | bigint;
  amountSupraMin: string | number | bigint;
  to: string;
  deadline?: string | number | bigint;
}

export class AmmTx extends TxBuilderBase {
  swapExactTokensForTokens(params: SwapExactParams): TxPayload {
    if (params.path.length < 2) throw new Error("path needs at least 2 tokens");
    return this.ammFn("amm_router", "swap_exact_tokens_for_tokens", [
      u64(params.amountIn),
      u64(params.minAmountOut),
      params.path.map(address),
      address(params.to),
      deadlineArg(params.deadline),
    ]);
  }

  swapTokensForExactTokens(params: SwapExactOutParams): TxPayload {
    if (params.path.length < 2) throw new Error("path needs at least 2 tokens");
    return this.ammFn("amm_router", "swap_tokens_for_exact_tokens", [
      u64(params.amountOut),
      u64(params.maxAmountIn),
      params.path.map(address),
      address(params.to),
      deadlineArg(params.deadline),
    ]);
  }

  addLiquidity(params: AddLiquidityParams): TxPayload {
    return this.ammFn("amm_router", "add_liquidity", [
      address(params.tokenA),
      address(params.tokenB),
      u64(params.amountADesired),
      u64(params.amountBDesired),
      u64(params.amountAMin),
      u64(params.amountBMin),
      address(params.to),
      deadlineArg(params.deadline),
    ]);
  }

  /** Adds liquidity to a token/SUPRA pair (native SUPRA side). */
  addLiquiditySupra(params: AddLiquiditySupraParams): TxPayload {
    return this.ammFn("amm_router", "add_liquidity_supra", [
      address(params.token),
      u64(params.amountTokenDesired),
      u64(params.amountTokenMin),
      u64(params.amountSupraDesired),
      u64(params.amountSupraMin),
      address(params.to),
      deadlineArg(params.deadline),
    ]);
  }

  removeLiquidity(params: RemoveLiquidityParams): TxPayload {
    return this.ammFn("amm_router", "remove_liquidity", [
      address(params.tokenA),
      address(params.tokenB),
      u64(params.liquidity),
      u64(params.amountAMin),
      u64(params.amountBMin),
      address(params.to),
      deadlineArg(params.deadline),
    ]);
  }

  removeLiquiditySupra(params: RemoveLiquiditySupraParams): TxPayload {
    return this.ammFn("amm_router", "remove_liquidity_supra", [
      address(params.token),
      u64(params.liquidity),
      u64(params.amountTokenMin),
      u64(params.amountSupraMin),
      address(params.to),
      deadlineArg(params.deadline),
    ]);
  }

  /** Converts native SUPRA into its FA representation (WSUP side). */
  wrapSupra(amount: string | number | bigint): TxPayload {
    return this.ammFn("amm_router", "wrap_supra", [u64(amount)]);
  }
}
