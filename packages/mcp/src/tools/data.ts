import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UNTRUSTED_NOTE, err, ok, reader } from "../context.js";

const RESOLUTIONS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

export function registerDataTools(server: McpServer): void {
  server.tool(
    "list_tokens",
    "Indexed tokens with current USD price and verification status (api.hoglet.xyz). Indexer data can lag on-chain state.",
    {
      search: z.string().optional().describe("Name, symbol or exact id"),
      verified: z.boolean().optional().describe("Only verified tokens"),
      page: z.number().int().positive().optional().describe("Page (default 1)"),
      limit: z.number().int().positive().max(100).optional().describe("Page size (default 20)"),
    },
    async ({ search, verified, page, limit }) => {
      try {
        const tokens = await reader.api.data.getTokens({
          search,
          verified,
          page,
          limit,
        });
        return ok({ count: tokens.length, tokens, note: UNTRUSTED_NOTE });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "list_amm_pairs",
    "Indexed AMM pairs with TVL, 24h volume and APR (api.hoglet.xyz).",
    {
      search: z.string().optional().describe("Pair id or token symbols"),
      verified: z.boolean().optional().describe("Only verified pairs"),
      token0: z.string().optional().describe("Exact token0 id"),
      token1: z.string().optional().describe("Exact token1 id"),
      sortBy: z
        .enum(["default", "apr", "tvl", "volume"])
        .optional()
        .describe("Sort key"),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    },
    async ({ search, verified, token0, token1, sortBy, sortOrder, page, limit }) => {
      try {
        const pairs = await reader.api.data.getAmmPairs({
          search,
          verified,
          token0,
          token1,
          sortBy,
          sortOrder,
          page,
          limit,
        });
        return ok({ count: pairs.length, pairs });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "list_staking_pools",
    "Indexed staking/farming pools with APY, TVL and reward rate (api.hoglet.xyz).",
    {
      search: z.string().optional().describe("Pool id, creator or token symbols"),
      verified: z.boolean().optional(),
      poolType: z.string().optional().describe("e.g. MEME, farm"),
      status: z.enum(["active", "ended"]).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    },
    async ({ search, verified, poolType, status, page, limit }) => {
      try {
        const pools = await reader.api.data.getStakingPools({
          search,
          verified,
          poolType,
          status,
          page,
          limit,
        });
        return ok({ count: pools.length, pools });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_ai_metrics",
    "Flattened metrics for active AMM pairs and staking pools, optimized for LLM contexts (api.hoglet.xyz).",
    {},
    async () => {
      try {
        return ok({ metrics: await reader.api.data.getAiMetrics() });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "list_launch_projects",
    "Indexed launchpad projects (launch.hoglet.xyz): name, symbol, token address, creator and project type.",
    {
      search: z.string().optional().describe("Name, symbol or token address"),
      projectType: z.string().optional().describe("e.g. Meme, BIG_DAO"),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    },
    async ({ search, projectType, page, limit }) => {
      try {
        const { data, count } = await reader.api.launch.getProjects({
          search,
          projectType,
          page,
          limit,
        });
        return ok({ count, projects: data, note: UNTRUSTED_NOTE });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_launch_project",
    "Indexed metadata for one launchpad token, with an on-chain name/symbol fallback when it is not indexed yet.",
    { tokenAddress: z.string().describe("Launched token metadata address") },
    async ({ tokenAddress }) => {
      try {
        const project = await reader.api.launch.getProject(tokenAddress);
        if (!project) {
          return err(new Error(`No launch project found for ${tokenAddress}`));
        }
        return ok({ project, note: UNTRUSTED_NOTE });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_token_holders",
    "Top holders of an indexed token with pagination (launch.hoglet.xyz). May be empty for tokens not yet indexed.",
    {
      tokenAddress: z.string().describe("Token metadata address"),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    },
    async ({ tokenAddress, page, limit }) => {
      try {
        const holders = await reader.api.launch.getHolders(tokenAddress, {
          page,
          limit,
        });
        return ok({ count: holders.length, holders });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_ohlc",
    "OHLC candles for a token from the Hoglet charts API (1m..1d).",
    {
      tokenAddress: z.string().describe("Token metadata address"),
      resolution: z.enum(RESOLUTIONS).optional().describe("Default 1h"),
    },
    async ({ tokenAddress, resolution }) => {
      try {
        const bars = await reader.api.launch.getOhlc(
          tokenAddress,
          resolution ?? "1h",
        );
        return ok({ count: bars.length, bars });
      } catch (error) {
        return err(error);
      }
    },
  );
}
