import { bindMethods, resolveConfig, type HogletConfig } from "@hoglet/core";
import { TxBuilderBase } from "./base.js";
import { DaoTx } from "./dao.js";
import { LocksTx } from "./locks.js";
import { ProposalsTx } from "./proposals.js";
import { GaugesTx } from "./gauges.js";
import { LauncherTx } from "./launcher.js";
import { VaultTx } from "./vault.js";
import { AmmTx } from "./amm.js";
import { FarmTx } from "./farm.js";
import { MultisigTx } from "./multisig.js";
import { ZapTx } from "./zap.js";
import { ScriptsTx } from "./scripts.js";
import { BoostTx } from "./boost.js";

export type {
  DeployTokenParams,
  DeployAndBuyTokenParams,
} from "./launcher.js";
export type {
  DeployAutonomousContractParams,
  UpgradeContractParams,
  DonateEoaToDaoParams,
} from "./vault.js";
export type {
  SwapExactParams,
  SwapExactOutParams,
  AddLiquidityParams,
  AddLiquiditySupraParams,
  RemoveLiquidityParams,
  RemoveLiquiditySupraParams,
} from "./amm.js";
export type {
  FarmPoolRef,
  StakeFarmParams,
  RegisterFarmPoolParams,
  DepositFarmRewardsParams,
  BoostFarmParams,
} from "./farm.js";
export type {
  CreateMultisigParams,
  CreateMultisigTransactionParams,
  MultisigSequenceParams,
} from "./multisig.js";
export type {
  ZapBuyLockParams,
  ZapBuyLockCoinParams,
} from "./zap.js";
export type { SubmitScriptParams } from "./scripts.js";

/**
 * Unsigned transaction builders for Hoglet.
 *
 * Implementations live in `src/tx/*` (one module per domain). The class keeps
 * a flat API (`tx.buyCurveTokens(...)`) and also exposes each module
 * (`tx.launcher.buyCurveTokens(...)`).
 */
export interface HogletTx
  extends DaoTx,
    LocksTx,
    ProposalsTx,
    GaugesTx,
    LauncherTx,
    VaultTx,
    AmmTx,
    FarmTx,
    MultisigTx,
    ZapTx,
    ScriptsTx,
    BoostTx {}

export class HogletTx extends TxBuilderBase {
  readonly dao: DaoTx;
  readonly locks: LocksTx;
  readonly proposals: ProposalsTx;
  readonly gauges: GaugesTx;
  readonly launcher: LauncherTx;
  readonly vault: VaultTx;
  readonly amm: AmmTx;
  readonly farm: FarmTx;
  readonly multisig: MultisigTx;
  readonly zap: ZapTx;
  readonly scripts: ScriptsTx;
  readonly boost: BoostTx;

  constructor(config: HogletConfig = resolveConfig()) {
    super(config);
    this.dao = new DaoTx(config);
    this.locks = new LocksTx(config);
    this.proposals = new ProposalsTx(config);
    this.gauges = new GaugesTx(config);
    this.launcher = new LauncherTx(config);
    this.vault = new VaultTx(config);
    this.amm = new AmmTx(config);
    this.farm = new FarmTx(config);
    this.multisig = new MultisigTx(config);
    this.zap = new ZapTx(config);
    this.scripts = new ScriptsTx(config);
    this.boost = new BoostTx(config);

    bindMethods(this, [
      this.dao,
      this.locks,
      this.proposals,
      this.gauges,
      this.launcher,
      this.vault,
      this.amm,
      this.farm,
      this.multisig,
      this.zap,
      this.scripts,
      this.boost,
    ]);
  }
}
