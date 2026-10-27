# @hoglet/core

Fuente única de verdad para direcciones, redes, RPC y lecturas de Hoglet.

- Direcciones de `final_2` (idénticas en testnet y mainnet).
- Endpoints por red (RPC v1/v3, API, chain id, explorer).
- `HogletReader`: DAOs, estado (active/blessed/curator), gauges, propuestas,
  locks, fases de trading, quotes de curva y AMM.
- Launcher: precio spot, quote exacto de tokens, stake HODL y stats del pool.
- AMM: quotes exact-in/exact-out por ruta, par on-chain, reservas y listado de pares.
- Farm del swap: estado del pool y posición del usuario (stake, rewards, boost).
- Multisig v2: owners, threshold, timeout, metadata, pendientes y config
  (admin/fee/treasury). Legacy custom: solo lectura para wallets antiguas.
- NFT wrapper V1→DA: colección envuelta determinista y `isWrapped` por token.
- Auxiliares DAO: boosts por colección, scripts (librería + allow-list) y
  seguridad de smart tokens (tax/blacklist/initialized).
- Vault (`dao_contracts_vault`): admin, creador, renuncia, freeze criptográfico,
  estado de seguridad del EOA, catálogo de contratos y direcciones predecibles.
- Helpers de formato `BigInt` (sin `Number` para montos).

```ts
import { HogletReader, resolveConfig } from "@hoglet/core";

const reader = new HogletReader(resolveConfig({ network: "mainnet" }));
const status = await reader.getDaoStatus("0x…");
```

La API REST es opcional: si el worker no responde, las lecturas siguen
funcionando on-chain.

**Vars:** `HOGLET_RPC_URL`, `HOGLET_API_BASE`, `HOGLET_INDEX_API`,
`HOGLET_DATA_API`, `HOGLET_LAUNCHER_API`, `HOGLET_SWAP_API`, `HOGLET_VAULT`,
`HOGLET_MULTISIG_V2`, `HOGLET_MULTISIG_LEGACY`.

**Testnet:** on-chain garantizado (mismas addresses que mainnet). Las APIs
indexadas de testnet no están soportadas; `api.daos` puede devolver vacío.

`ApiClient` agrupa las superficies HTTP: `api.daos` (listado vía
`daos.hoglet.xyz` en mainnet, propuestas/comentarios vía worker), `api.data`
(`api.hoglet.xyz`: tokens, AMM, staking), `api.launch`
(`launch.hoglet.xyz/api`: proyectos, holders, OHLC) y `api.swap`
(`swap.hoglet.xyz`: `getSwapPath`, `getProtocolStats`). `api.daos` soporta
`getDaos`, `getDaosPage` (search/sort/page/limit), `getProposals`,
`getComments` y `get(path)` como escape hatch.

El código está modularizado en `src/reader/*` (daos, gauges, launcher, amm,
governance, vault) y `src/api/*`; `HogletReader` mantiene una API plana y además
expone cada módulo (`reader.vault`, `reader.launcher`, ...).
