import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

export function registerExtrasTools(server: McpServer): void {
  server.tool(
    "get_collection_boost",
    "Boost (bps) configured for an NFT collection in a DAO (dao_boost registry).",
    {
      daoAddress: z.string().describe("DAO account address"),
      collectionAddress: z.string().describe("NFT collection address"),
    },
    async ({ daoAddress, collectionAddress }) => {
      try {
        const [boostBps, isBoosted] = await Promise.all([
          reader.getCollectionBoost(daoAddress, collectionAddress),
          reader.isBoostedCollection(daoAddress, collectionAddress),
        ]);
        return ok({ daoAddress, collectionAddress, boostBps, isBoosted });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_boost_registry",
    "Boost registry metadata for a DAO: size, hard cap (bps) and whether a collection is boosted.",
    {
      daoAddress: z.string().describe("DAO account address"),
      collectionAddress: z
        .string()
        .optional()
        .describe("Optional collection to check"),
    },
    async ({ daoAddress, collectionAddress }) => {
      try {
        const [size, hardCapBps, isBoosted] = await Promise.all([
          reader.getBoostRegistrySize(daoAddress),
          reader.getBoostHardCapBps(),
          collectionAddress
            ? reader.isBoostedCollection(daoAddress, collectionAddress)
            : Promise.resolve(null),
        ]);
        return ok({ daoAddress, size, hardCapBps, collectionAddress, isBoosted });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_dao_script",
    "Script library entry: execution hash, source CID, args flag and audit state.",
    { scriptId: z.number().int().nonnegative().describe("Script id") },
    async ({ scriptId }) => {
      try {
        return ok({ script: await reader.getScript(scriptId) });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "list_dao_scripts",
    "Script library config and count (dao_scripts::library).",
    {},
    async () => {
      try {
        const [count, config] = await Promise.all([
          reader.getScriptCount(),
          reader.getLibraryConfig(),
        ]);
        return ok({ count, config });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "is_script_approved",
    "Whether a DAO has allow-listed a script (dao_scripts::vault::is_approved).",
    {
      daoAddress: z.string().describe("DAO account address"),
      scriptId: z.number().int().nonnegative().describe("Script id"),
    },
    async ({ daoAddress, scriptId }) => {
      try {
        return ok({
          daoAddress,
          scriptId,
          approved: await reader.isScriptApproved(daoAddress, scriptId),
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "is_token_tax_active",
    "Whether a DAO smart token currently charges transfer tax (dao_tokens::smart_token).",
    { tokenAddress: z.string().describe("Token metadata address") },
    async ({ tokenAddress }) => {
      try {
        const [isSmartToken, taxActive] = await Promise.all([
          reader.isSmartToken(tokenAddress),
          reader.isTaxActive(tokenAddress),
        ]);
        return ok({ tokenAddress, isSmartToken, taxActive });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "is_token_blacklisted",
    "Whether an account is blacklisted on a DAO smart token (token, account).",
    {
      tokenAddress: z.string().describe("Token metadata address"),
      account: z.string().describe("Account to check"),
    },
    async ({ tokenAddress, account }) => {
      try {
        return ok({
          tokenAddress,
          account,
          blacklisted: await reader.isBlacklisted(tokenAddress, account),
        });
      } catch (error) {
        return err(error);
      }
    },
  );
}
