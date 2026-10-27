import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fromRaw, toRaw } from "@hoglet/core";
import { config, err, ok, reader } from "../context.js";

export function registerLauncherTools(server: McpServer): void {
  server.tool(
    "get_trading_phase",
    "Trading phase for a token: curve | migrating | amm | governance-only | unknown. Static DAOs are reported as governance-only.",
    { tokenAddress: z.string().describe("Governance token FA metadata address") },
    async ({ tokenAddress }) => {
      try {
        return ok({ phase: await reader.getTradingPhase(tokenAddress) });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_curve_progress",
    "Bonding-curve progress: quote token raised vs target threshold plus completion percentage (quote token may not be SUPRA).",
    { tokenAddress: z.string().describe("Governance token FA metadata address") },
    async ({ tokenAddress }) => {
      try {
        const progress = await reader.getCurveProgress(tokenAddress);
        if (!progress) {
          return err(new Error("No launchpad curve pool found for this token"));
        }
        return ok({ progress });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "quote_curve_buy",
    "Quote how many governance tokens a quote-token amount buys on the bonding curve (pre-migration only).",
    {
      tokenAddress: z.string().describe("Governance token FA metadata address"),
      quoteAmount: z
        .number()
        .positive()
        .describe("Amount of the pool quote token to spend, human units (e.g. 12.5)"),
    },
    async ({ tokenAddress, quoteAmount }) => {
      try {
        if (!(await reader.isLauncherProject(tokenAddress))) {
          return err(
            new Error("Token is not a launchpad project (no bonding curve pool)"),
          );
        }
        const quote = await reader.getPoolQuote(tokenAddress);
        const quoteDecimals = quote?.decimals ?? 8;
        const quoteAmountRaw = toRaw(String(quoteAmount), quoteDecimals);
        const { tokensOutRaw, metadata } = await reader.quoteCurveBuy(
          tokenAddress,
          quoteAmountRaw,
        );
        const decimals = metadata?.decimals ?? 8;
        return ok({
          tokenAddress,
          quoteSymbol: quote?.symbol ?? null,
          quoteAmount,
          quoteAmountRaw,
          tokensOutRaw,
          tokensOut: fromRaw(tokensOutRaw, decimals),
          tokenDecimals: decimals,
          tokenSymbol: metadata?.symbol ?? null,
          note: "Execute with hoglet_core::buy_tokens(caller, token, quote_in_raw, min_token_out_raw). Apply your own min_out slippage guard.",
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "quote_amm_buy",
    "Quote a post-migration AMM swap, including price impact vs the 1-unit reference rate (warn -10%, critical -25%).",
    {
      outputToken: z.string().describe("FA metadata address of the token you want"),
      amountIn: z.number().positive().describe("Input amount in human units"),
      inputToken: z
        .string()
        .optional()
        .describe("FA metadata paid (defaults to WSUP, the AMM wrapper side)"),
    },
    async ({ outputToken, amountIn, inputToken }) => {
      try {
        const input = inputToken ?? config.contracts.wsup;
        const inputMeta = await reader.getTokenMetadata(input).catch(() => null);
        const decimals = inputMeta?.decimals ?? 8;
        const amountInRaw = toRaw(String(amountIn), decimals);
        const quote = await reader.quoteAmmBuy(outputToken, amountInRaw, input);
        return ok({
          quote,
          note: "FA->FA uses amm_router::swap_exact_tokens_for_tokens. The path must use the wrapper side held by the pair (WSUP for SUPRA).",
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_curve_price",
    "Current bonding-curve spot price (quote per whole token) for a launched token.",
    { tokenAddress: z.string().describe("Launched token metadata address") },
    async ({ tokenAddress }) => {
      try {
        const price = await reader.getCurrentPrice(tokenAddress);
        if (!price) {
          return err(new Error(`Token ${tokenAddress} is not a launchpad project`));
        }
        return ok({ price });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_hodl_stake",
    "HODL staking position of a user in a launched token, plus pool totals (staked vs supply).",
    {
      tokenAddress: z.string().describe("Launched token metadata address"),
      userAddress: z.string().describe("User address"),
    },
    async ({ tokenAddress, userAddress }) => {
      try {
        const [position, pool] = await Promise.all([
          reader.getUserStakeInfo(tokenAddress, userAddress),
          reader.getHodlPoolStats(tokenAddress),
        ]);
        if (!position) {
          return err(new Error(`Token ${tokenAddress} is not a launchpad project`));
        }
        return ok({ position, pool });
      } catch (error) {
        return err(error);
      }
    },
  );
}
