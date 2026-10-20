#!/usr/bin/env node
/**
 * Launcher integration fixture.
 *
 * Token SPACE (0x808ac5…) was launched with hoglet_core 0xd6a0… on mainnet.
 * This test locks the open-curve behaviour of the SDK against real chain data:
 * launcher detection, pool-state parsing, deterministic pool address,
 * curve progress and quote.
 *
 * Run: npm run smoke:launcher
 */

import {
  HogletReader,
  derivePoolAddress,
  resolveConfig,
} from "@hoglet/core";

const TOKEN =
  "0x808ac527a8af1d0234acb5be7f97703aa6b739b1ff2c6ce11a03e14267945b5e";
const EXPECTED_POOL =
  "0x1e00f31f34f6bd49e24dcb4f18943d3cb9297d8c821f35a73693e83f806cd2d5";
const EXPECTED_LAUNCHER =
  "0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885";

const reader = new HogletReader(resolveConfig({ network: "mainnet" }));
let failures = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  PASS ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log(`Launcher integration (mainnet) — token=${TOKEN}`);

  check("launcher address", reader.contracts.launcher === EXPECTED_LAUNCHER);

  const resource = await reader.getLauncherResourceAddress();
  check("launcher resource address", Boolean(resource), resource ?? "none");

  const derived = resource ? derivePoolAddress(resource, TOKEN) : null;
  check("deterministic pool address", derived === EXPECTED_POOL, derived ?? "none");

  const isLauncher = await reader.isLauncherProject(TOKEN);
  check("is_launcher_project", isLauncher === true);

  const state = await reader.getPoolState(TOKEN);
  check("pool state parsed", Boolean(state));
  check("pool state address", state?.poolAddress === EXPECTED_POOL);
  check("pool quote is SUPRA (0xa)", state?.quoteMetadata === "0xa");
  check("target threshold = 840 SUPRA", state?.targetThreshold === "84000000000");

  const phase = await reader.getTradingPhase(TOKEN);
  check(
    "trading phase is curve/migrating/amm",
    phase.phase === "curve" || phase.phase === "migrating" || phase.phase === "amm",
    phase.phase,
  );

  const progress = await reader.getCurveProgress(TOKEN);
  check("curve progress parsed", Boolean(progress));
  if (progress) {
    check("quote symbol", progress.quoteSymbol === "SUPRA");
    check("target quote 840", progress.targetQuote === "840");
    console.log(
      `  INFO raised=${progress.raisedQuote} ${progress.quoteSymbol ?? ""} (${progress.percentComplete}%) completed=${progress.completed} migrated=${progress.migrated}`,
    );
  }

  if (phase.phase === "curve") {
    const quote = await reader.quoteCurveBuy(TOKEN, "100000000");
    check("quote 1 SUPRA → tokens > 0", BigInt(quote.tokensOutRaw) > 0n, quote.tokensOutRaw);
    check("quote metadata symbol", quote.metadata?.symbol === "SPACE", quote.metadata?.symbol ?? "none");
  } else {
    console.log("  SKIP quote (curve already completed/migrated)");
  }

  const dao = await reader.getDao(TOKEN);
  check("DAO resolved", Boolean(dao));
  check("DAO is inflationary", dao?.status.isInflationary === true, dao?.status.status);
  check("DAO is blessed", dao?.status.isBlessed === true);

  if (failures > 0) {
    console.error(`FAILED (${failures} check(s))`);
    process.exitCode = 1;
  } else {
    console.log("OK");
  }
}

main().catch((error) => {
  console.error("SMOKE FAILED:", error);
  process.exitCode = 1;
});
