import { resolveConfig, type HogletConfig } from "./config.js";
import { bindMethods } from "./mixins.js";
import { ReaderContext } from "./reader/context.js";
import { DaosReader } from "./reader/daos.js";
import { GaugesReader } from "./reader/gauges.js";
import { LauncherReader } from "./reader/launcher.js";
import { AmmReader } from "./reader/amm.js";
import { GovernanceReader } from "./reader/governance.js";
import { VaultReader } from "./reader/vault.js";
import { FarmReader } from "./reader/farm.js";
import { MultisigReader } from "./reader/multisig.js";
import { NftReader } from "./reader/nft.js";
import { BoostReader } from "./reader/boost.js";
import { ScriptsReader } from "./reader/scripts.js";
import { TokenSafetyReader } from "./reader/tokenSafety.js";

export { derivePoolAddress, ReaderContext } from "./reader/context.js";
export { DaosReader } from "./reader/daos.js";
export { GaugesReader } from "./reader/gauges.js";
export { LauncherReader } from "./reader/launcher.js";
export { AmmReader } from "./reader/amm.js";
export { GovernanceReader } from "./reader/governance.js";
export { VaultReader } from "./reader/vault.js";
export { FarmReader } from "./reader/farm.js";
export type { FarmPoolRef } from "./reader/farm.js";
export { MultisigReader } from "./reader/multisig.js";
export { NftReader } from "./reader/nft.js";
export { BoostReader } from "./reader/boost.js";
export { ScriptsReader } from "./reader/scripts.js";
export type { ScriptInfo, ScriptLibraryConfig } from "./reader/scripts.js";
export { TokenSafetyReader } from "./reader/tokenSafety.js";

/**
 * Read-only Hoglet client.
 *
 * Implementations live in `src/reader/*` (one module per domain). The class
 * keeps a flat API for consumers (`reader.getDaoStatus`) while also exposing
 * each module (`reader.daos.getDaoStatus`) for discoverability.
 */
export interface HogletReader
  extends DaosReader,
    GaugesReader,
    LauncherReader,
    AmmReader,
    GovernanceReader,
    VaultReader,
    FarmReader,
    MultisigReader,
    NftReader,
    BoostReader,
    ScriptsReader,
    TokenSafetyReader {}

export class HogletReader extends ReaderContext {
  readonly daos: DaosReader;
  readonly gauges: GaugesReader;
  readonly launcher: LauncherReader;
  readonly amm: AmmReader;
  readonly governance: GovernanceReader;
  readonly vault: VaultReader;
  readonly farm: FarmReader;
  readonly multisig: MultisigReader;
  readonly nft: NftReader;
  readonly boost: BoostReader;
  readonly scripts: ScriptsReader;
  readonly tokenSafety: TokenSafetyReader;

  constructor(config: HogletConfig = resolveConfig()) {
    super(config);
    this.daos = new DaosReader(config);
    this.gauges = new GaugesReader(config);
    this.launcher = new LauncherReader(config);
    this.amm = new AmmReader(config);
    this.governance = new GovernanceReader(config);
    this.vault = new VaultReader(config);
    this.farm = new FarmReader(config);
    this.multisig = new MultisigReader(config);
    this.nft = new NftReader(config);
    this.boost = new BoostReader(config);
    this.scripts = new ScriptsReader(config);
    this.tokenSafety = new TokenSafetyReader(config);

    bindMethods(this, [
      this.daos,
      this.gauges,
      this.launcher,
      this.amm,
      this.governance,
      this.vault,
      this.farm,
      this.multisig,
      this.nft,
      this.boost,
      this.scripts,
      this.tokenSafety,
    ]);
  }
}
