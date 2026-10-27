import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

export function registerVaultTools(server: McpServer): void {
  server.tool(
    "get_contract_control",
    "Who controls a deployed contract (dao_contracts_vault): admin, creator, EOA proxy, renouncement and cryptographic freeze status. Use this instead of treating a tombstone as immutable.",
    {
      contractAddress: z
        .string()
        .describe("Published package / managed account address"),
    },
    async ({ contractAddress }) => {
      try {
        return ok({ control: await reader.getContractControl(contractAddress) });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_eoa_security_status",
    "Security status of an EOA per the vault: unmanaged, permanently_renounced, dao_governed or hazard_key_still_active (renounce NOT effective).",
    { eoaAddress: z.string().describe("Externally owned account address") },
    async ({ eoaAddress }) => {
      try {
        const [status, keyAnnihilated, permanentlyImmutable] =
          await Promise.all([
            reader.getEoaSecurityStatus(eoaAddress),
            reader.isEoaKeyAnnihilated(eoaAddress),
            reader.isEoaPermanentlyImmutable(eoaAddress),
          ]);
        return ok({
          eoaAddress,
          status,
          keyAnnihilated,
          permanentlyImmutable,
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_creator_contracts",
    "Contracts deployed or donated by a creator, as recorded in the vault catalog.",
    {
      creatorAddress: z.string().describe("Creator address"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max entries (default 50)"),
    },
    async ({ creatorAddress, limit }) => {
      try {
        const contracts = await reader.getContractsByCreator(
          creatorAddress,
          limit ?? 50,
        );
        return ok({ count: contracts.length, contracts });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_vault_contracts",
    "Paginated public catalog of contracts managed by dao_contracts_vault (capped at 50 per page).",
    {
      offset: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Start index (default 0)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Page size (default 50)"),
    },
    async ({ offset, limit }) => {
      try {
        const [total, contracts] = await Promise.all([
          reader.getVaultTotalContracts(),
          reader.getVaultContractsPage(offset ?? 0, limit ?? 50),
        ]);
        return ok({ total, count: contracts.length, contracts });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "predict_contract_address",
    "Deterministic address the vault will publish to for a (creator, label) pair. Read-only derivation; no deployment.",
    {
      creatorAddress: z.string().describe("Creator address"),
      label: z.string().describe("Package label (1..=64 UTF-8 bytes)"),
    },
    async ({ creatorAddress, label }) => {
      try {
        const predicted = await reader.predictNextContractAddress(
          creatorAddress,
          label,
        );
        return ok({ creatorAddress, label, predicted });
      } catch (error) {
        return err(error);
      }
    },
  );
}
