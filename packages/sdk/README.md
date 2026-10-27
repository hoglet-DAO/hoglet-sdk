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
bribes, gauges, boosts, **launcher** (`deployToken`, `buyCurveTokens`,
`sellCurveTokens`, `buyCurveTokensExact`, `migrateToAmm`, `stakeLaunchedToken`,
`unstakeLaunchedToken`, `harvestLaunchedToken`, `activateDelayedDao`),
**vault** (`deployAutonomousContract`, `upgradeContract`,
`transferContractAdmin`, `renounceContract`, `donateEoaToDao`,
`cancelEoaDelegation`), **AMM** (`swapExactTokensForTokens`,
`swapTokensForExactTokens`, `addLiquidity`, `addLiquiditySupra`,
`removeLiquidity`, `removeLiquiditySupra`, `wrapSupra`) y **farm staking**
(`stakeFarm`, `unstakeFarm`, `harvestFarm`, `registerFarmPool`,
`depositFarmRewards`, `boostFarm`, `removeFarmBoost`).

**Multisig v2** (nativo `0x1::multisig_account` + registry de Hoglet):
`createMultisig`, `importMultisig`, `removeMultisig`,
`createMultisigTransaction`, `approveMultisigTransaction`,
`rejectMultisigTransaction`, `voteMultisigTransaction` y los payloads
self-governed (`addMultisigOwners`, `updateMultisigSignaturesRequired`, …).
La **ejecución** no es una entry function en este deployment: se envía el
payload guardado como transacción multisig multi-ed25519 (lo firma la wallet/bot).
El multisig legacy solo se lee, no se construyen transacciones nuevas.

**Zap** (`dao_router::dao_zap`): `buyAndLockFas` (paga con cualquier FA) y
`buyAndLockCoin` (paga con un Coin nativo) compran y lockean en una sola tx.

**Scripts y boosts de colección**: `submitScript`, `approveScript`,
`removeScriptApproval` (`dao_scripts`) y `setCollectionBoost`,
`removeCollectionBoost` (`dao_boost`).

**Treasury/Coin**: `wrapDaoCoin(dao, coinType)` (`dao_factory::anchor::wrap`,
live on mainnet) y `proposeTreasuryTransferCoin(...)` con type argument
(`dao_proposals::propose_treasury_transfer_coin`; verifica que esté desplegado
antes de usarlo).

El SDK nunca firma ni custodia llaves: devuelve el payload para tu wallet o bot.
