import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UNTRUSTED_NOTE, err, ok, reader } from "../context.js";

export function registerDaoTools(server: McpServer): void {
  server.tool(
    "list_daos",
    "List DAOs registered in the Hoglet index, with optional search, sort and pagination. Includes network metadata.",
    {
      search: z.string().optional().describe("Name or symbol fragment"),
      verified: z.boolean().optional().describe("Only verified DAOs"),
      sort: z.enum(["tvl", "name", "created"]).optional().describe("Default tvl"),
      order: z.enum(["asc", "desc"]).optional().describe("Default desc"),
      page: z.number().int().positive().optional().describe("Page (default 1)"),
      limit: z
        .number()
        .int()
        .positive()
        .max(50)
        .optional()
        .describe("Page size (default 12)"),
    },
    async ({ search, verified, sort, order, page, limit }) => {
      try {
        const result = await reader.listDaosPage({
          search,
          verified,
          sort,
          order,
          page,
          limit,
        });
        return ok({
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          count: result.data.length,
          daos: result.data.map((dao) => ({
            name: dao.name ?? null,
            symbol: dao.symbol ?? null,
            daoAddress: dao.daoAddress,
            creatorAddress: dao.creatorAddress ?? null,
            totalValueLocked: dao.totalValueLocked ?? null,
            stakedTvl: dao.stakedTvl ?? null,
            apr: dao.apr ?? null,
            isPaused: dao.isPaused ?? null,
            isInflationary: dao.isInflationary ?? null,
            verified: dao.isVerified ?? dao.is_verified ?? null,
          })),
          note:
            result.data.length === 0
              ? "The indexer API returned no DAOs for these filters. On-chain reads still work by token/DAO address."
              : UNTRUSTED_NOTE,
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_dao_proposals",
    "Indexed proposal history for a DAO (status, votes, metadata URI). Historical data lives off-chain; on-chain reads remain authoritative for live state.",
    { daoAddress: z.string().describe("DAO account address") },
    async ({ daoAddress }) => {
      try {
        const proposals = await reader.api.daos.getProposals(daoAddress);
        return ok({ count: proposals.length, proposals });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_proposal_comments",
    "Off-chain comments for a proposal id.",
    { proposalId: z.string().describe("Indexed proposal id (UUID)") },
    async ({ proposalId }) => {
      try {
        const comments = await reader.api.daos.getComments(proposalId);
        return ok({ count: comments.length, comments });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_dao",
    "Resolve a governance token to its DAO and return on-chain metadata plus curatorship/blessing status.",
    { tokenAddress: z.string().describe("Governance token FA metadata address") },
    async ({ tokenAddress }) => {
      try {
        const dao = await reader.getDao(tokenAddress);
        if (!dao) {
          return err(new Error(`No DAO found for token ${tokenAddress}`));
        }
        return ok({ dao, note: UNTRUSTED_NOTE });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_dao_status",
    "Governance status of a DAO: active, blessed, inflationary, guardian and factory curator. Explains what is blocked while under curatorship.",
    { daoAddress: z.string().describe("DAO account address") },
    async ({ daoAddress }) => {
      try {
        return ok({ status: await reader.getDaoStatus(daoAddress) });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_gauges",
    "List a DAO's emission gauges with their staking token, votes and active state (inactive gauges reject votes).",
    {
      daoAddress: z.string().describe("DAO account address"),
      epoch: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Epoch to read votes for (default: current)"),
    },
    async ({ daoAddress, epoch }) => {
      try {
        const gauges = await reader.getGauges(daoAddress, epoch);
        return ok({
          count: gauges.length,
          gauges: gauges.map((gauge) => ({
            gaugeId: gauge.gaugeId,
            destination: gauge.destination,
            poolAddress: gauge.poolAddress,
            symbol: gauge.symbol,
            totalVotes: gauge.totalVotes,
            isActive: gauge.isActive,
          })),
          note: "Bribes are not indexed here; read restore::get_total_bribes_for per token on-chain.",
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_gauge_active",
    "Whether a gauge can receive votes/emissions. Birth-inactive gauges reject votes on-chain.",
    {
      daoAddress: z.string().describe("DAO account address"),
      gaugeId: z.number().int().nonnegative().describe("Sequential gauge id"),
    },
    async ({ daoAddress, gaugeId }) => {
      try {
        const active = await reader.isGaugeActive(daoAddress, gaugeId);
        return ok({ daoAddress, gaugeId, active });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_epoch_info",
    "Current Hoglet voting epoch (7-day epochs) and the final-24h voting lockout.",
    {},
    async () => {
      return ok({
        epoch: reader.getEpochInfo(),
        note: "Votes are impossible during the final 24h (anti bribe-sniping). Voting power uses the previous epoch snapshot.",
      });
    },
  );

  server.tool(
    "get_token_metadata",
    "Resolve an FA token's symbol, name, decimals and icon. Accepts Metadata or FungibleStore addresses.",
    { faAddress: z.string().describe("FA metadata address or FungibleStore address") },
    async ({ faAddress }) => {
      try {
        const metadata = await reader.getTokenMetadata(faAddress);
        if (!metadata) {
          return err(new Error(`No fungible metadata resolvable for ${faAddress}`));
        }
        return ok({ metadata, note: UNTRUSTED_NOTE });
      } catch (error) {
        return err(error);
      }
    },
  );
}
