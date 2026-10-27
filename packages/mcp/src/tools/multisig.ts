import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok, reader } from "../context.js";

export function registerMultisigTools(server: McpServer): void {
  server.tool(
    "get_multisig",
    "Native Supra multisig (v2): owners, signature threshold, timeout and sequence numbers. Use get_multisig_pending for the queue.",
    { multisigAddress: z.string().describe("Multisig account address") },
    async ({ multisigAddress }) => {
      try {
        const account = await reader.getMultisigAccount(multisigAddress);
        return ok({ account });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_user_multisigs",
    "Multisigs registered to a user in the v2 registry.",
    { user: z.string().describe("User address") },
    async ({ user }) => {
      try {
        const multisigs = await reader.getUserMultisigs(user);
        return ok({ count: multisigs.length, multisigs });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_multisig_pending",
    "Pending v2 multisig transactions with approvals/rejections and the stored payload (execution is a multi-ed25519 multisig transaction, not an entry function).",
    { multisigAddress: z.string().describe("Multisig account address") },
    async ({ multisigAddress }) => {
      try {
        const pending = await reader.getMultisigPending(multisigAddress);
        return ok({ count: pending.length, pending });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_multisig_config",
    "V2 registry/admin config: admin, creation fee (raw) and treasury address.",
    {},
    async () => {
      try {
        return ok({ config: await reader.getMultisigConfig() });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "predict_multisig_address",
    "Address of the next native multisig that a creator would deploy.",
    { creator: z.string().describe("Creator address") },
    async ({ creator }) => {
      try {
        const predicted = await reader.getNextMultisigAddress(creator);
        return ok({ creator, predicted });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "is_multisig_owner",
    "Whether an address is an owner of a given multisig (useful for contract-control checks).",
    {
      user: z.string().describe("Address to check"),
      multisigAddress: z.string().describe("Multisig account address"),
    },
    async ({ user, multisigAddress }) => {
      try {
        return ok({
          user,
          multisigAddress,
          isOwner: await reader.isMultisigOwner(user, multisigAddress),
        });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_legacy_multisigs",
    "Legacy (custom) multisigs for a user. Read-only compatibility; new wallets use v2.",
    { user: z.string().describe("User address") },
    async ({ user }) => {
      try {
        const [ids, multisigs] = await Promise.all([
          reader.getLegacyMultisigIds(user),
          reader.getLegacyMultisigsForAddress(user),
        ]);
        return ok({ count: multisigs.length, ids, multisigs });
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    "get_legacy_multisig_proposals",
    "Pending proposals of a legacy multisig (participants, withdrawals). Read-only.",
    {
      multisigId: z
        .number()
        .int()
        .nonnegative()
        .describe("Legacy multisig id"),
    },
    async ({ multisigId }) => {
      try {
        const [details, proposals] = await Promise.all([
          reader.getLegacyMultisigDetails(multisigId),
          reader.getLegacyPendingProposals(multisigId),
        ]);
        return ok({ details, count: proposals.length, proposals });
      } catch (error) {
        return err(error);
      }
    },
  );
}
