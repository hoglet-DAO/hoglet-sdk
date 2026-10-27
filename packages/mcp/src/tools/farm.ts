import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

const POOL_FIELDS = {
  creator: z.string().describe("Address that registered the pool"),
  stakeToken: z.string().describe("Staked FA metadata address"),
  rewardToken: z.string().describe("Reward FA metadata address"),
};

export function registerFarmTools(server: McpServer): void {
  server.tool(
    "get_farm_pool",
    "On-chain swap-farm pool: exists, rewards per second, window, total staked and boosted.",
    POOL_FIELDS,
    async ({ creator, stakeToken, rewardToken }) => {
      try {
        const pool = await reader.getFarmPool({
          creator,
          stakeToken,
          rewardToken,
        });
        return ok({ pool });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_farm_position",
    "User position in a swap-farm pool: staked, pending rewards, boost amount and boost flag.",
    { ...POOL_FIELDS, user: z.string().describe("User address") },
    async ({ creator, stakeToken, rewardToken, user }) => {
      try {
        const position = await reader.getFarmPosition(
          { creator, stakeToken, rewardToken },
          user,
        );
        return ok({ position });
      } catch (error) {
        return err(error);
      }
    },
  );
}
