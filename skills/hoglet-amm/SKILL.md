---
name: hoglet-amm
description: "Use when quoting or executing Hoglet AMM swaps and liquidity operations on Supra: swap exact tokens, exact-output swaps, add/remove liquidity, wrap SUPRA. Reads routes and quotes with MCP and builds unsigned @hoglet/sdk payloads."
---

# Hoglet AMM

## Use this skill when

- The user wants a swap quote, route, or price impact.
- The user wants to swap tokens, add/remove liquidity, or wrap SUPRA.
- The user needs to verify reserves or a pair address before trading.

## Do not use this skill when

- The user only wants read-only data. Use MCP.
- The user wants the skill to sign or hold keys.

## Preflight

1. Resolve config with `resolveConfig({ network })`.
2. Read with MCP:
   - `get_swap_path` for the route.
   - `quote_amm_buy` or `quote_amm_exact_out` for the quote and price impact.
   - `get_amm_reserves` and `get_amm_pair` to verify the pool.
3. Confirm token addresses, amounts, recipient, slippage, and deadline.
4. Explain that the quote is data, not a guarantee.

## Build payloads

```ts
import { resolveConfig } from "@hoglet/core";
import { HogletTx } from "@hoglet/sdk";

const config = resolveConfig({ network: "testnet" });
const tx = new HogletTx(config);

const swap = tx.amm.swapExactTokensForTokens({
  amountIn: quoteInRaw,
  minAmountOut,
  path: [tokenIn, tokenOut],
  to: recipient,
  deadline,
});

const add = tx.amm.addLiquidity({
  tokenA,
  tokenB,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  to: recipient,
});

const remove = tx.amm.removeLiquidity({
  tokenA,
  tokenB,
  liquidity,
  amountAMin,
  amountBMin,
  to: recipient,
});
```

Use raw base units. `path` must contain at least two FA metadata addresses.

## Signing

Follow `../references/star-key-signing.md`.

## Guardrails

- Never swap without a quote and a non-zero minimum output.
- Re-quote immediately before signing; reserves change.
- Verify the route; multi-hop paths can include unexpected tokens.
- For tax-aware quote tokens, use the correct function; exact-output swaps may be rejected on-chain.
- Stop if the pair, reserves, or recipient is unclear.
- No financial advice or expected-return claims.

## Verify

After the transaction, read reserves and the user's balances/position with MCP. Report the hash and final state.
