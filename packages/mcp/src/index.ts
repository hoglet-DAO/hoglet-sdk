#!/usr/bin/env node
/**
 * Hoglet MCP Server (read-only, v0.3.0)
 *
 * Exposes Hoglet (Supra) to AI assistants: DAOs, curatorship/blessing status,
 * bonding curves, gauges, epochs, AMM quotes, contract-vault control and the
 * indexed data APIs. Tool implementations live in `src/tools/*`.
 *
 * READ-ONLY: never signs transactions, never holds keys. All network and
 * contract addresses come from @hoglet/core (single source of truth).
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Hoglet MCP server failed to start:", error);
  process.exit(1);
});
