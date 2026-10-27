import { ReaderContext, asNumber, asString } from "./context.js";

/** `dao_boost::boost_registry` reads (per-DAO NFT collection boosts). */
export class BoostReader extends ReaderContext {
  private boostFn(fn: string): string {
    return `${this.config.contracts.daoBoost}::boost_registry::${fn}`;
  }

  async getCollectionBoost(
    daoAddress: string,
    collectionAddress: string,
  ): Promise<string> {
    const raw = await this.safeViewOne(this.boostFn("get_collection_boost"), [
      daoAddress,
      collectionAddress,
    ]);
    return asString(raw ?? "0");
  }

  async isBoostedCollection(
    daoAddress: string,
    collectionAddress: string,
  ): Promise<boolean> {
    const raw = await this.safeViewOne(this.boostFn("is_boosted_collection"), [
      daoAddress,
      collectionAddress,
    ]);
    return raw === true;
  }

  async getBoostRegistrySize(daoAddress: string): Promise<number> {
    const raw = await this.safeViewOne(this.boostFn("get_registry_size"), [
      daoAddress,
    ]);
    return asNumber(raw ?? 0);
  }

  async getBoostHardCapBps(): Promise<string> {
    const raw = await this.safeViewOne(this.boostFn("hard_cap_bps"), []);
    return asString(raw ?? "0");
  }
}
