import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDaoTools } from "./tools/daos.js";
import { registerLauncherTools } from "./tools/launcher.js";
import { registerVaultTools } from "./tools/vault.js";
import { registerDataTools } from "./tools/data.js";
import { registerSwapTools } from "./tools/swap.js";
import { registerAmmTools } from "./tools/amm.js";
import { registerFarmTools } from "./tools/farm.js";
import { registerMultisigTools } from "./tools/multisig.js";
import { registerNftTools } from "./tools/nft.js";
import { registerExtrasTools } from "./tools/extras.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "hoglet", version: "0.3.0" });
  registerDaoTools(server);
  registerLauncherTools(server);
  registerVaultTools(server);
  registerDataTools(server);
  registerSwapTools(server);
  registerAmmTools(server);
  registerFarmTools(server);
  registerMultisigTools(server);
  registerNftTools(server);
  registerExtrasTools(server);
  return server;
}
