# @hoglet/mcp-server

Servidor **MCP (Model Context Protocol) read-only** para que asistentes IA
(Claude Desktop/Code, Cursor, agentes) consulten Hoglet en Supra.

**Nunca firma transacciones ni maneja llaves.** Para crear/operar gobernanza usa
`@hoglet/sdk`.

## Tools

| Tool | Qué hace |
|---|---|
| `list_daos` | DAOs indexadas (búsqueda, sort, verified, paginación) |
| `get_dao` | Token → DAO + metadata on-chain + estado |
| `get_dao_proposals` | Historial indexado de propuestas de una DAO |
| `get_proposal_comments` | Comentarios off-chain de una propuesta |
| `get_dao_status` | `is_active`, `is_blessed`, `is_inflationary`, guardian, curator |
| `get_gauges` | Gauges, staking token, votos, activo |
| `get_trading_phase` | `curve` / `migrating` / `amm` / `governance-only` / `unknown` |
| `get_curve_progress` | Recaudado vs target de la bonding curve |
| `quote_curve_buy` | Quote pre-migración |
| `quote_amm_buy` | Quote post-migración + price impact |
| `get_token_metadata` | Metadata (acepta Metadata o FungibleStore) |
| `get_gauge_active` | Si el gauge acepta votos/emisiones |
| `get_epoch_info` | Epoch actual y lockout de 24h |
| `get_contract_control` | Admin, creador, proxy EOA, renuncia y freeze criptográfico |
| `get_eoa_security_status` | `unmanaged` / `permanently_renounced` / `dao_governed` / `hazard_key_still_active` |
| `get_creator_contracts` | Contratos desplegados/donados por un creator |
| `get_vault_contracts` | Catálogo paginado del vault (máx. 50 por página) |
| `predict_contract_address` | Dirección determinista para `(creator, label)` |
| `get_hodl_stake` | Stake HODL de un usuario + totales del pool |
| `get_curve_price` | Precio spot actual de la bonding curve |
| `list_tokens` | Tokens indexados con precio USD y verificación |
| `list_amm_pairs` | Pares AMM con TVL, volumen 24h y APR |
| `list_staking_pools` | Pools de staking con APY, TVL y reward rate |
| `get_ai_metrics` | Métricas planas AMM/staking para contexto LLM |
| `list_launch_projects` | Proyectos indexados del launcher |
| `get_launch_project` | Metadata indexada de un token lanzado |
| `get_token_holders` | Top holders con paginación |
| `get_ohlc` | Velas OHLC (`1m`…`1d`) |
| `get_swap_path` | Ruta óptima (multi-hop) entre dos tokens |
| `get_protocol_stats` | TVL, volumen y fees del protocolo (último snapshot) |
| `get_protocol_stats_history` | Serie histórica de métricas del protocolo |
| `quote_amm_exact_out` | Input necesario para una salida exacta (con impacto) |
| `quote_amm_path` | Quote exact-input por una ruta multi-hop |
| `get_amm_reserves` | Reservas on-chain de un par |
| `get_amm_pair` | Address del par on-chain para dos tokens |
| `get_farm_pool` | Pool de farm: rewards/seg, ventana y TVL stakeado |
| `get_farm_position` | Stake, rewards pendientes y boost de un usuario |
| `get_multisig` | Owners, threshold, timeout y metadata de un multisig v2 |
| `get_user_multisigs` | Multisigs registrados a un usuario |
| `get_multisig_pending` | Transacciones pendientes + payload guardado |
| `get_multisig_config` | Admin, creation fee y treasury |
| `predict_multisig_address` | Address del próximo multisig de un creator |
| `is_multisig_owner` | Si una address es owner de un multisig |
| `get_legacy_multisigs` | Multisigs legacy de un usuario (read-only) |
| `get_legacy_multisig_proposals` | Propuestas pendientes legacy (read-only) |
| `get_wrapped_collection_address` | Colección DA determinista de un NFT V1 wrapped |
| `is_nft_wrapped` | Si un token DA fue emitido por el wrapper |
| `get_collection_boost` | Boost (bps) de una colección en una DAO |
| `get_boost_registry` | Tamaño, hard cap y estado del registry de boosts |
| `get_dao_script` | Hash, CID, args y auditoría de un script |
| `list_dao_scripts` | Config y cantidad de scripts de la librería |
| `is_script_approved` | Si una DAO allow-listeó un script |
| `is_token_tax_active` | Si un smart token cobra tax |
| `is_token_blacklisted` | Si una cuenta está blacklisted en un smart token |

## Configuración

```bash
pnpm install
pnpm run build
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
`HOGLET_DATA_API`, `HOGLET_LAUNCHER_API`, `HOGLET_RPC_URL`, `HOGLET_DAO_FACTORY`,
`HOGLET_LAUNCHER`, `HOGLET_AMM_ROUTER`, `HOGLET_WSUP`, `HOGLET_VAULT`,
`HOGLET_MULTISIG_V2`, `HOGLET_MULTISIG_LEGACY`, `HOGLET_NFT_WRAPPER`.
Toda respuesta incluye `network` y `chainId`.

## Notas

- Las direcciones de contrato son **las mismas** en testnet y mainnet; solo cambian RPC/API.
- DAO estática recién creada: `is_active=true` pero `is_blessed=false`; config, guardian
  y scripts quedan bloqueados hasta que el curator firme `charter::bless_dao`.
- Si la API del indexer no responde, las lecturas siguen funcionando on-chain.
