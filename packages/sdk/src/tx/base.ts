import { resolveConfig, type HogletConfig } from "@hoglet/core";
import type { TxPayload } from "../payload.js";

/**
 * Shared transaction-building state. The SDK never signs and never holds
 * keys: builders return an unsigned payload for a wallet or bot signer.
 */
export class TxBuilderBase {
  readonly config: HogletConfig;

  constructor(config: HogletConfig = resolveConfig()) {
    this.config = config;
  }

  protected factory(
    module: string,
    fn: string,
    args: unknown[],
    typeArguments: string[] = [],
  ): TxPayload {
    return {
      function: `${this.config.contracts.daoFactory}::${module}::${fn}`,
      typeArguments,
      functionArguments: args,
    };
  }

  protected router(
    module: string,
    fn: string,
    args: unknown[],
    typeArguments: string[] = [],
  ): TxPayload {
    return {
      function: `${this.config.contracts.daoRouter}::${module}::${fn}`,
      typeArguments,
      functionArguments: args,
    };
  }

  protected launcherFn(
    module: string,
    fn: string,
    args: unknown[],
  ): TxPayload {
    return {
      function: `${this.config.contracts.launcher}::${module}::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  protected vaultFn(module: string, fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.vault}::${module}::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  protected ammFn(module: string, fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.ammRouter}::${module}::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  /** Framework calls (e.g. `0x1::multisig_account`). */
  protected frameworkFn(
    module: string,
    fn: string,
    args: unknown[],
    typeArguments: string[] = [],
  ): TxPayload {
    return {
      function: `0x1::${module}::${fn}`,
      typeArguments,
      functionArguments: args,
    };
  }
}
