import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

export function registerNftTools(server: McpServer): void {
  server.tool(
    "get_wrapped_collection_address",
    "Deterministic DA collection address for a V1 NFT collection wrapped by the Hoglet NFT wrapper.",
    {
      creator: z.string().describe("V1 collection creator address"),
      collectionName: z.string().describe("V1 collection name"),
    },
    async ({ creator, collectionName }) => {
      try {
        return ok({
          creator,
          collectionName,
          collectionAddress: await reader.getWrappedCollectionAddress(
            creator,
            collectionName,
          ),
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "is_nft_wrapped",
    "Whether a DA token address was minted by the Hoglet V1→DA NFT wrapper.",
    { tokenAddress: z.string().describe("DA token object address") },
    async ({ tokenAddress }) => {
      try {
        return ok({
          tokenAddress,
          isWrapped: await reader.isWrapped(tokenAddress),
        });
      } catch (error) {
        return err(error);
      }
    },
  );
}
