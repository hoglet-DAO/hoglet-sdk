#!/usr/bin/env node
/**
 * Smoke test for @hoglet/core. Runs against HOGLET_NETWORK (default testnet).
 * Uses on-chain reads only; the API is optional and failures are tolerated.
 */

import {
  HogletReader,
  describeMoveError,
  fromRaw,
  resolveConfig,
} from "@hoglet/core";

const reader = new HogletReader(resolveConfig());
const config = reader.config;

function line(label, value) {
  console.log(`  ${label}: ${value}`);
}

async function main() {
  console.log(
    `Hoglet smoke test — network=${config.network} chainId=${config.chainId}`,
  );
  line("rpcV1", config.rpcV1);
  line("apiBase", config.apiBase);
  line("daoFactory", config.contracts.daoFactory);

  const fee = await reader.getCreationFee();
  line("creationFee", `${fromRaw(fee, 8)} SUPRA (raw ${fee})`);

  const curator = await reader.getCurator();
  line("curator", curator ?? "none");

  const epoch = reader.getEpochInfo();
  line(
    "epoch",
    `${epoch.currentEpoch} (votingOpen=${epoch.votingOpen}, hoursLeft=${epoch.hoursUntilNextEpoch})`,
  );

  const daos = await reader.listDaos();
  line("indexedDaos", daos.length);

  const first = daos[0];
  if (first?.daoAddress) {
    const status = await reader.getDaoStatus(first.daoAddress);
    line("firstDao", `${first.name ?? "?"} → ${status.status}`);
    line("guardian", status.guardian ?? "none");
    line("blessed", String(status.isBlessed));
  }

  console.log("OK");
}

main().catch((error) => {
  console.error("SMOKE FAILED:", describeMoveError(error));
  process.exitCode = 1;
});
