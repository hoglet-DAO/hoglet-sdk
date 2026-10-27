---
name: hoglet-launcher
description: "Use when deploying or trading on the Hoglet Launcher (bonding curve) on Supra: deploy a token, buy/sell curve tokens, migrate to AMM, or manage HODL stakes. Uses read-only MCP quotes and unsigned @hoglet/sdk payloads."
---

# Hoglet Launcher

## Use this skill when

- The user wants to deploy a token on the Hoglet Launcher.
- The user wants to buy or sell on a bonding curve, migrate to AMM, or stake/unstake HODL.
- The user needs a quote or the current curve phase before acting.

## Do not use this skill when

- The user only wants to read data. Use the MCP server directly.
- The user wants to sign or custody keys. Signing happens in the wallet.
- The request involves another brand or memecoin. This is Hoglet-only.

## Preflight

1. Resolve config with `resolveConfig({ network })`; confirm testnet or mainnet.
2. Read state with MCP:
   - `get_trading_phase` for the token.
   - `get_curve_progress`, `get_curve_price`, `quote_curve_buy`.
   - `get_hodl_stake` for a user position.
3. Confirm the quote token. The canonical quote is WSUP (`config.contracts.wsup`).
4. Confirm token metadata: name, symbol, URI, raising amount, optional socials.
5. Show a summary and ask for explicit confirmation before signing.

## Build payloads

```ts
import { resolveConfig } from "@hoglet/core";
import { HogletTx } from "@hoglet/sdk";

const config = resolveConfig({ network: "testnet" });
const tx = new HogletTx(config);

const deploy = tx.launcher.deployToken({
  raising: 1_000_000_000_000n,
  name: "Example Token",
  symbol: "TKN",
  uri: "https://example.com/metadata/tkn.json",
  quoteAddress: config.contracts.wsup,
});

const buy = tx.launcher.buyCurveTokens(tokenAddress, quoteInRaw, minTokensOut);
const sell = tx.launcher.sellCurveTokens(tokenAddress, tokenAmountRaw, minQuoteOut);
const migrate = tx.launcher.migrateToAmm(tokenAddress);
```

Use raw base units for amounts. Use `buyCurveTokensExact` only when the quote token is not tax-aware.

## Signing

Follow `../references/star-key-signing.md`. The SDK only returns an unsigned payload.

## Guardrails

- Never deploy, buy, sell, migrate, or stake without explicit confirmation.
- Verify the curve phase; do not buy after migration with curve methods.
- Use `minTokensOut` / `minQuoteOut` from the quote; do not leave them at zero.
- Stop if the token address, quote address, or network is unclear.
- No financial promises. Report mechanics, not expected returns.

## Verify

After the transaction, read the token phase and the user position with MCP. Report the transaction hash and the resulting state.
