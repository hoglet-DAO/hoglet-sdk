# @hoglet/core

Fuente única de verdad para direcciones, redes, RPC y lecturas de Hoglet.

- Direcciones de `final_2` (idénticas en testnet y mainnet).
- Endpoints por red (RPC v1/v3, API, chain id, explorer).
- `HogletReader`: DAOs, estado (active/blessed/curator), gauges, propuestas,
  locks, fases de trading, quotes de curva y AMM.
- Helpers de formato `BigInt` (sin `Number` para montos).

```ts
import { HogletReader, resolveConfig } from "@hoglet/core";

const reader = new HogletReader(resolveConfig({ network: "mainnet" }));
const status = await reader.getDaoStatus("0x…");
```

La API REST es opcional: si el worker no responde, las lecturas siguen
funcionando on-chain.
