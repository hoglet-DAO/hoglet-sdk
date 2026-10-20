# @hoglet/mcp-server

Servidor **MCP (Model Context Protocol) read-only** para que asistentes IA
(Claude Desktop/Code, Cursor, agentes) consulten Hoglet en Supra.

**Nunca firma transacciones ni maneja llaves.** Para crear/operar gobernanza usa
`@hoglet/sdk`.

## Tools

| Tool | Qué hace |
|---|---|
| `list_daos` | DAOs indexadas (nombre, símbolo, daoAddress, TVL) |
| `get_dao` | Token → DAO + metadata on-chain + estado |
| `get_dao_status` | `is_active`, `is_blessed`, `is_inflationary`, guardian, curator |
| `get_gauges` | Gauges, staking token, votos, activo |
| `get_trading_phase` | `curve` / `migrating` / `amm` / `governance-only` / `unknown` |
| `get_curve_progress` | Recaudado vs target de la bonding curve |
| `quote_curve_buy` | Quote pre-migración |
| `quote_amm_buy` | Quote post-migración + price impact |
| `get_token_metadata` | Metadata (acepta Metadata o FungibleStore) |
| `get_gauge_active` | Si el gauge acepta votos/emisiones |
| `get_epoch_info` | Epoch actual y lockout de 24h |

## Configuración

```bash
npm install
npm run build
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "hoglet": {
      "command": "node",
      "args": ["D:\\hoglet-sdk\\packages\\mcp\\dist\\index.js"],
      "env": { "HOGLET_NETWORK": "mainnet" }
    }
  }
}
```

Variables: `HOGLET_NETWORK` (`testnet`|`mainnet`, default `testnet`), `HOGLET_API_BASE`,
`HOGLET_RPC_URL`, `HOGLET_DAO_FACTORY`, `HOGLET_LAUNCHER`, `HOGLET_AMM_ROUTER`, `HOGLET_WSUP`.
Toda respuesta incluye `network` y `chainId`.

## Notas

- Las direcciones de contrato son **las mismas** en testnet y mainnet; solo cambian RPC/API.
- DAO estática recién creada: `is_active=true` pero `is_blessed=false`; config, guardian
  y scripts quedan bloqueados hasta que el curator firme `charter::bless_dao`.
- Si la API del indexer no responde, las lecturas siguen funcionando on-chain.
