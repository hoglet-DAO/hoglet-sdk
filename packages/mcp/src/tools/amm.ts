import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

export function registerAmmTools(server: McpServer): void {
  server.tool(
    "quote_amm_exact_out",
    "Quote the input needed for an exact AMM output amount (get_amounts_in), with price impact.",
    {
      outputToken: z.string().describe("FA metadata address you want to receive"),
      amountOut: z.string().describe("Exact output amount in raw base units"),
      inputToken: z
        .string()
        .optional()
        .describe("FA metadata paid (defaults to WSUP)"),
    },
    async ({ outputToken, amountOut, inputToken }) => {
      try {
        const quote = await reader.quoteAmmExactOut(
          outputToken,
          amountOut,
          inputToken,
        );
        return ok({ quote });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "quote_amm_path",
    "Quote an exact-input swap along a given multi-hop path (use get_swap_path first).",
    {
      path: z
        .array(z.string())
        .min(2)
        .describe("FA metadata addresses from input to output"),
      amountIn: z.string().describe("Input amount in raw base units"),
    },
    async ({ path, amountIn }) => {
      try {
        return ok({ quote: await reader.quoteAmmPath(path, amountIn) });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_amm_reserves",
    "On-chain reserves for a token pair (factory::get_reserves).",
    {
      tokenA: z.string().describe("First FA metadata address"),
      tokenB: z.string().describe("Second FA metadata address"),
    },
    async ({ tokenA, tokenB }) => {
      try {
        const reserves = await reader.getAmmReserves(tokenA, tokenB);
        if (!reserves) {
          return err(new Error("Could not read reserves for this pair"));
        }
        return ok({ reserves });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_amm_pair",
    "Resolve the on-chain pair address for two tokens (null when no pool exists).",
    {
      tokenA: z.string().describe("First FA metadata address"),
      tokenB: z.string().describe("Second FA metadata address"),
    },
    async ({ tokenA, tokenB }) => {
      try {
        return ok({ pair: await reader.getAmmPair(tokenA, tokenB) });
      } catch (error) {
        return err(error);
      }
    },
  );
}
