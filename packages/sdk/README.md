# @hoglet/sdk

Constructores de transacciones de Hoglet. **No firma ni custodia llaves**: devuelve
`{ function, typeArguments, functionArguments }` para que lo firmes con la wallet
del usuario o con tu bot (`supra-l1-sdk`).

```ts
import { HogletTx } from "@hoglet/sdk";
import { resolveConfig } from "@hoglet/core";

const tx = new HogletTx(resolveConfig({ network: "mainnet" }));
const payload = tx.createDaoStatic("0x<token-metadata>");
// wallet.signAndSubmit(payload)
```

## Flujo de DAO estática (final_2)

1. **Token FA normal** → `createDaoStatic(token)`.
   - Si el token tiene hooks (`smart_token`) aborta con
     `E_SMART_TOKEN_NOT_SUPPORTED_FOR_STATIC_DAO`.
2. **Token con hooks / coin legacy** → `createDaoStaticForWrapper(wrappedToken, nativeToken)`.
   El wrapper se deriva en `dao_router::dao_wrapper` (seed `HOGLET_DAO_GOV_WRAPPER`).
3. La DAO nace `is_active=true`, `is_blessed=false` y con el curator como guardian.
   - `config`, `guardian` y scripts quedan bloqueados hasta `blessDao(dao)`.
   - El curator (guardian de la DAO) firma `bless_dao`; es **irreversible**.
   - El admin puede `reassignCurator(dao, newCurator)` antes del blessing.

## Alcance v1

Incluye creación estática, locks, propuestas, votación, ejecución, rewards,
bribes, gauges y boosts. **No incluye** compra en curva, migración, swaps AMM
ni `dao_zap` (v1.1).
