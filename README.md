# Hoglet SDK (core + transaction SDK + MCP)

Repositorio único para todo el código **cliente** de Hoglet. No contiene la web ni los contratos.

```
hoglet-sdk/
├─ packages/core/   @hoglet/core       Direcciones, redes, RPC, lecturas (fuente única de verdad)
├─ packages/sdk/    @hoglet/sdk        Constructores de transacciones (NO firma, NO custodia llaves)
└─ packages/mcp/    @hoglet/mcp-server Servidor MCP read-only para asistentes IA
```

## Por qué está separado de `Full-stack`

`Full-stack` es la aplicación web (Next.js). El core y el SDK son **librerías publicables** que
también usan bots, integradores y agentes IA. Mantenerlas fuera del árbol de la web evita
acoplamientos y, sobre todo, evita que las direcciones se desincronicen (ya pasó entre
`mcp`, `llms.txt` y `.env`).

## Direcciones desplegadas (verificadas on-chain)

Son **idénticas en testnet y mainnet** por diseño:

| Contrato | Address |
|---|---|
| `dao_factory` | `0xe7ebc7fa1e5d6ce8a102780dd22577a5f8bc9cdb9de7c9fb250176b017f25fcd` |
| `dao_router` | `0x81d6612bb40d99e79fa99114a82953a3a19971b37b147ea269ce4a535288fbb8` |
| `dao_genesis` | `0x7ea1513782150d8c19896dd9da91215d7b81d10ad4c0ae1467167b6c8834d037` |
| `hoglet_core` (launcher) | `0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885` |
| `spike_amm` router | `0x3045d27b5fada1e30897a741fb184e48ef0bff3717aea23918ebc1e5c7153083` |
| WSUP | `0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43` |

Solo cambian los endpoints por red:

| Red | RPC | API | Chain ID |
|---|---|---|---|
| testnet | `https://rpc-testnet.supra.com` | `https://testnet-dao-api.hoglet.xyz` | 6 |
| mainnet | `https://rpc-mainnet.supra.com` | `https://dao-api.hoglet.xyz` | 8 |

> Los deployments antiguos de testnet (`0x90ef…` factory, `0x67cf…` launcher) **no se soportan**.

## Uso

```bash
npm install
npm run build
npm run smoke                 # testnet por defecto
$env:HOGLET_NETWORK="mainnet"; npm run smoke
npm run smoke:launcher        # integración real con un token lanzado (SPACE)
```

Variables: `HOGLET_NETWORK` (`testnet`|`mainnet`), `HOGLET_RPC_URL`, `HOGLET_RPC_V1`,
`HOGLET_RPC_V3`, `HOGLET_API_BASE`, `HOGLET_DAO_FACTORY`, `HOGLET_DAO_ROUTER`,
`HOGLET_LAUNCHER`, `HOGLET_AMM_ROUTER`, `HOGLET_WSUP`.

## Licencia

- `@hoglet/core` y `@hoglet/sdk`: Apache-2.0 (ver `LICENSE`).
- `@hoglet/mcp-server`: MIT (ver `packages/mcp/LICENSE`).
- Los contratos desplegados no forman parte de este repositorio.
