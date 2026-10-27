---
name: hoglet-vault
description: "Use when deploying, upgrading, transferring, or renouncing a contract through the Hoglet Vault on Supra, or when donating an EOA to a DAO. High-risk operations; read control state with MCP and require explicit confirmation."
---

# Hoglet Vault

## Use this skill when

- The user wants to deploy an autonomous contract through the vault.
- The user wants to upgrade, transfer admin, or renounce a contract.
- The user wants to donate an EOA to a DAO or cancel a delegation.
- The user needs to inspect who controls a contract.

## Preflight

1. Resolve config with `resolveConfig({ network })`.
2. Read state with MCP:
   - `get_contract_control` for admin, creator, EOA proxy, renouncement, freeze status.
   - `get_eoa_security_status` for EOA hazard state.
   - `get_creator_contracts` and `predict_contract_address`.
3. Confirm the exact contract, current admin, and intended new admin.
4. Explain irreversibility: renouncement and some upgrades cannot be undone.

## Build payloads

```ts
import { resolveConfig } from "@hoglet/core";
import { HogletTx } from "@hoglet/sdk";

const config = resolveConfig({ network: "testnet" });
const tx = new HogletTx(config);

const deploy = tx.vault.deployAutonomousContract({
  // see DeployAutonomousContractParams in @hoglet/sdk
});

const upgrade = tx.vault.upgradeContract({
  // see UpgradeContractParams in @hoglet/sdk
});

const renounce = tx.vault.renounceContract(contractAddress);
const donate = tx.vault.donateEoaToDao({
  // see DonateEoaToDaoParams in @hoglet/sdk
});
```

Use the exported TypeScript types for exact fields.

## Signing

Follow `../references/star-key-signing.md`. The SDK only returns an unsigned payload.

## Guardrails

- **Do not auto-execute upgrades or renouncements.** Require explicit confirmation with the contract address and consequence.
- Stop if the current admin/control state is unclear or conflicts with MCP.
- Verify the new admin address character by character.
- After the transaction, read control state again and report it.
- No financial advice.
