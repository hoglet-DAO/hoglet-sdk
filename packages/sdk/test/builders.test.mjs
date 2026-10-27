import test from "node:test";
import assert from "node:assert/strict";
import { HogletTx } from "../dist/index.js";
import { resolveConfig } from "@hoglet/core";

const config = resolveConfig({ network: "mainnet" });
const tx = new HogletTx(config);
const A = "0x808ac527a8af1d0234acb5be7f97703aa6b739b1ff2c6ce11a03e14267945b5e";
const B = "0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43";

test("AMM swap payload", () => {
  const payload = tx.amm.swapExactTokensForTokens({
    amountIn: 10,
    minAmountOut: 9,
    path: [B, A],
    to: A,
    deadline: 1000,
  });
  assert.equal(payload.function, `${config.contracts.ammRouter}::amm_router::swap_exact_tokens_for_tokens`);
  assert.deepEqual(payload.typeArguments, []);
  assert.deepEqual(payload.functionArguments, ["10", "9", [B, A], A, "1000"]);
});

test("zap coin carries the CoinType argument", () => {
  const payload = tx.zap.buyAndLockCoin({
    govToken: A,
    amount: 10,
    minAmountOut: 1,
    path: [A],
    lockEpochs: 4,
    deadline: 1000,
    coinType: "0x1::supra_coin::SupraCoin",
  });
  assert.equal(payload.function, `${config.contracts.daoRouter}::dao_zap::buy_and_lock_coin`);
  assert.deepEqual(payload.typeArguments, ["0x1::supra_coin::SupraCoin"]);
});

test("dao factory wrap carries the CoinType argument", () => {
  const payload = tx.wrapDaoCoin(A, "0x1::supra_coin::SupraCoin");
  assert.equal(payload.function, `${config.contracts.daoFactory}::anchor::wrap`);
  assert.deepEqual(payload.typeArguments, ["0x1::supra_coin::SupraCoin"]);
  assert.deepEqual(payload.functionArguments, [A]);
});

test("coin treasury proposal encodes type argument and args", () => {
  const payload = tx.proposeTreasuryTransferCoin(
    A,
    B,
    "Pay",
    "0xbeef",
    B,
    100,
    "0x1::supra_coin::SupraCoin",
  );
  assert.equal(payload.function, `${config.contracts.daoRouter}::dao_proposals::propose_treasury_transfer_coin`);
  assert.deepEqual(payload.typeArguments, ["0x1::supra_coin::SupraCoin"]);
  assert.deepEqual(payload.functionArguments, [A, B, "Pay", "0xbeef", B, "100"]);
});

test("launcher deploy sends empty optional metadata", () => {
  const payload = tx.deployToken({
    raising: 100,
    name: "Token",
    symbol: "TKN",
    uri: "ipfs://x",
    quoteAddress: B,
  });
  assert.equal(payload.function, `${config.contracts.launcher}::hoglet_core::deploy`);
  assert.deepEqual(payload.functionArguments, [
    "100", "Token", "TKN", "ipfs://x", "", "", "", B, "0",
  ]);
});

test("vault deploy encodes label and byte vectors", () => {
  const payload = tx.vault.deployAutonomousContract({
    label: "pkg",
    metadata: "0x00",
    modules: [new Uint8Array([1, 2])],
    owner: "0x0",
  });
  assert.equal(payload.function, `${config.contracts.vault}::vault::deploy_autonomous_contract`);
  assert.deepEqual(payload.functionArguments, ["0x706b67", "0x00", ["0x0102"], "0x0"]);
});

test("multisig create encodes metadata values", () => {
  const payload = tx.multisig.createMultisig({
    additionalOwners: [A],
    numSignaturesRequired: 2,
    metadata: { name: "Treasury" },
  });
  assert.equal(payload.function, `${config.contracts.multisigV2}::multisig_registry::create_and_register`);
  assert.deepEqual(payload.functionArguments[2], ["name"]);
  assert.deepEqual(payload.functionArguments[3], ["0x5472656173757279"]);
});

test("flat API and module API build the same payload", () => {
  assert.deepEqual(
    tx.buyCurveTokens(A, 10, 9),
    tx.launcher.buyCurveTokens(A, 10, 9),
  );
});

test("invalid label fails fast", () => {
  assert.throws(
    () =>
      tx.vault.deployAutonomousContract({
        label: "",
        metadata: "0x00",
        modules: [new Uint8Array([1])],
        owner: "0x0",
      }),
    /label must be/,
  );
});
