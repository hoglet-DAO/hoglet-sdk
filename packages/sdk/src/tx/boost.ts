import { TxBuilderBase } from "./base.js";
import { address, u64, type TxPayload } from "../payload.js";

/**
 * `dao_boost::boost_registry`: per-DAO collection boost configuration.
 * These builders take the DAO signer, so submit them as a DAO payload
 * (proposal/execution), not from a user wallet.
 */
export class BoostTx extends TxBuilderBase {
  private registryFn(fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.daoBoost}::boost_registry::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  setCollectionBoost(
    collectionAddress: string,
    boostBps: string | number | bigint,
  ): TxPayload {
    return this.registryFn("set_collection", [
      address(collectionAddress),
      u64(boostBps),
    ]);
  }

  removeCollectionBoost(collectionAddress: string): TxPayload {
    return this.registryFn("remove_collection", [address(collectionAddress)]);
  }
}
