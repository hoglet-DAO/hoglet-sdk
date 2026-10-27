import { ReaderContext, asString, isZeroAddress } from "./context.js";

/**
 * V1 → DA NFT wrapper. Reads only: the underlying Move functions are `public
 * fun` (not entry), so wrapping/unwrapping requires a script or a module.
 */
export class NftReader extends ReaderContext {
  private wrapper(fn: string): string {
    return `${this.config.contracts.nftWrapper}::nft_wrapper::${fn}`;
  }

  /** Deterministic DA collection address for a wrapped V1 collection. */
  async getWrappedCollectionAddress(
    creator: string,
    collectionName: string,
  ): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.wrapper("get_wrapped_collection_address"),
      [creator, collectionName],
    );
    const address = asString(raw);
    return isZeroAddress(address) ? null : address;
  }

  /** True when a DA token address was minted by the wrapper. */
  async isWrapped(v2TokenAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(this.wrapper("is_wrapped"), [
      v2TokenAddress,
    ]);
    return raw === true;
  }
}
