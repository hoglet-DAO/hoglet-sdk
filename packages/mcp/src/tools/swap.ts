import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

export function registerSwapTools(server: McpServer): void {
  server.tool(
    "get_swap_path",
    "Best AMM route between two tokens (possibly multi-hop) from the swap app's pool graph. Use it before quoting/executing a swap.",
    {
      tokenIn: z.string().describe("FA metadata address paid"),
      tokenOut: z.string().describe("FA metadata address received"),
      amount: z
        .string()
        .optional()
        .describe("Raw amount (base units) for the dust/liquidity heuristic"),
      exactOut: z
        .boolean()
        .optional()
        .describe("True when `amount` is the exact output"),
    },
    async ({ tokenIn, tokenOut, amount, exactOut }) => {
      try {
        const path = await reader.api.swap.getSwapPath({
          tokenIn,
          tokenOut,
          amount,
          exactOut,
        });
        return ok({
          tokenIn,
          tokenOut,
          path,
          note:
            path.length === 0
              ? "No route found (missing pool, zero reserves or unsupported network)."
              : "Pass this path to amm_router::swap_exact_tokens_for_tokens (or the exact-out variant).",
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_protocol_stats",
    "Latest protocol-wide metrics: total/AMM/staking TVL, 24h volume and fees (swap.hoglet.xyz).",
    {},
    async () => {
      try {
        const stats = await reader.api.swap.getProtocolStats({ latest: true });
        return ok({ stats });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_protocol_stats_history",
    "Historical protocol-wide metrics, newest last (swap.hoglet.xyz).",
    {
      limit: z.number().int().min(1).max(500).optional().describe("Default 30"),
      orderDirection: z.enum(["asc", "desc"]).optional(),
    },
    async ({ limit, orderDirection }) => {
      try {
        const stats = await reader.api.swap.getProtocolStatsHistory({
          limit: limit ?? 30,
          orderDirection,
        });
        return ok({ count: stats.length, stats });
      } catch (error) {
        return err(error);
      }
    },
  );
}
