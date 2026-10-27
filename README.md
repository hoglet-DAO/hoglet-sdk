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
| `dao_boost` | `0x0893f46752ea8ee1416cf061c2f0ffd4ff538020630731c4e96074f3d64e0107` |
| `dao_libs` | `0xc91177c0c283292d8de2a1be69926d904d055bc8ae758a2a2958e7508121a30e` |
| `dao_tokens` | `0x195047fcb6bb4c2918ab5c61e08a777a575bc2f32116bfc40bbed49c04a13bf8` |
| `dao_scripts` | `0x739eb15a8beb2660db940041b5c29e96270feb2ee77eecb023877f22cee977e9` |
| `dao_views` | `0xf3f3650ace9d98102b7023c61c1f6c5a698008ded9662585faf069c4810cb24e` |
| `dao_tax_router` | `0x74329c1fd2d57b2a902f737b5ad71b4610214635de74b8dbeb82be9b1a985493` |
| `nft_wrapper` (V1→DA) | `0x2926688850d36e736b1b80bdafaafffba51da5e8cac98d721380e70f0f568d56` |
| `hoglet_core` (launcher) | `0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885` |
| `spike_amm` router | `0x3045d27b5fada1e30897a741fb184e48ef0bff3717aea23918ebc1e5c7153083` |
| WSUP | `0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43` |
| `dao_contracts_vault` | `0x06dc465fc9c70df95df1e1c0b1fb44d72d70a2f0479dd8ee8158e79e8a6f171a` |
| multisig v2 (`registry` + `admin`) | `0xe7572de52f8b92f88b7164558369cf1da822dc0842b652364d7278999cdcd64c` |
| multisig legacy (read-only) | `0x5d7f79da44885dfd543f81139cff25fb43121e7ae03ebd720f9ac9e6449dd1a5` |

Solo cambian los endpoints por red:

| Red | RPC | API | Chain ID |
|---|---|---|---|
| testnet | `https://rpc-testnet.supra.com` | `https://testnet-dao-api.hoglet.xyz` | 6 |
| mainnet | `https://rpc-mainnet.supra.com` | `https://dao-api.hoglet.xyz` | 8 |

> Los deployments antiguos de testnet (`0x90ef…` factory, `0x67cf…` launcher) **no se soportan**.

## ABIs en Move

En Move **no hay archivos ABI separados**: la interfaz se publica con el módulo y se
consulta on-chain en `GET /rpc/v3/accounts/{address}/modules/{module}` (nombres,
parámetros, type arguments, `view`/`entry` y retornos). Por eso basta la address
del contrato; el SDK deriva las firmas desde ahí o desde `sources/*.move`.

Auxiliares DAO ya centralizados y con helpers: `dao_boost` (boosts por colección),
`dao_scripts` (librería + allow-list por DAO), `dao_tokens::smart_token`
(tax/blacklist). `dao_libs`, `dao_views` y `tax_router` están en `CONTRACTS`.

> **Testnet:** solo se garantiza on-chain. Las APIs indexadas de testnet no están
> soportadas (saturadas / sin dominio estable); el DAO index no resuelve. RPC,
> contratos, lecturas y transacciones funcionan porque las addresses son las mismas
> que mainnet. Para datos indexados usa mainnet.

## Uso

```bash
pnpm install
pnpm run build
pnpm run smoke                 # testnet por defecto
$env:HOGLET_NETWORK="mainnet"; pnpm run smoke
pnpm run smoke:launcher        # integración real con un token lanzado (SPACE)
```

Variables: `HOGLET_NETWORK` (`testnet`|`mainnet`), `HOGLET_RPC_URL`, `HOGLET_RPC_V1`,
`HOGLET_RPC_V3`, `HOGLET_API_BASE`, `HOGLET_INDEX_API`, `HOGLET_DATA_API`,
`HOGLET_LAUNCHER_API`, `HOGLET_SWAP_API`, `HOGLET_DAO_FACTORY`, `HOGLET_DAO_ROUTER`,
`HOGLET_DAO_GENESIS`, `HOGLET_DAO_BOOST`, `HOGLET_DAO_LIBS`, `HOGLET_DAO_TOKENS`,
`HOGLET_DAO_SCRIPTS`, `HOGLET_DAO_VIEWS`, `HOGLET_TAX_ROUTER`,
`HOGLET_LAUNCHER`, `HOGLET_AMM_ROUTER`, `HOGLET_WSUP`, `HOGLET_VAULT`,
`HOGLET_MULTISIG_V2`, `HOGLET_MULTISIG_LEGACY`, `HOGLET_NFT_WRAPPER`.

APIs indexadas (opcionales): `https://daos.hoglet.xyz` (DAO index con filtros y
TVL/APR), `https://api.hoglet.xyz` (tokens, AMM, staking),
`https://launch.hoglet.xyz/api` (proyectos, holders, OHLC) y
`https://swap.hoglet.xyz` (rutas óptimas y stats de protocolo). Las lecturas
on-chain siguen funcionando si esas APIs no responden.

## Licencia

- `@hoglet/core` y `@hoglet/sdk`: Apache-2.0 (ver `LICENSE`).
- `@hoglet/mcp-server`: MIT (ver `packages/mcp/LICENSE`).
- Los contratos desplegados no forman parte de este repositorio.
