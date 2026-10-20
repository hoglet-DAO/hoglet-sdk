import { resolveConfig, type HogletConfig } from "@hoglet/core";
import {
  address,
  addresses,
  u64,
  u64Vector,
  u8,
  type Bytes,
  type TxPayload,
} from "./payload.js";

/**
 * Builds unsigned Hoglet transactions. The SDK never signs and never holds
 * keys: pass the returned payload to the user's wallet or to your bot's
 * signer (e.g. Supra wallet adapter / supra-l1-sdk).
 *
 * Verified against the `final_2` deployment (factory 0xe7eb…).
 */
export class HogletTx {
  readonly config: HogletConfig;

  constructor(config: HogletConfig = resolveConfig()) {
    this.config = config;
  }

  private factory(module: string, fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.daoFactory}::${module}::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  private router(module: string, fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.daoRouter}::${module}::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  // -------------------------------------------------------------------------
  // Static DAO creation
  // -------------------------------------------------------------------------

  /** Plain (non-dispatchable) FA. Aborts E_SMART_TOKEN_NOT_SUPPORTED_FOR_STATIC_DAO for smart tokens. */
  createDaoStatic(governanceToken: string): TxPayload {
    return this.factory("petra", "create_dao_static", [address(governanceToken)]);
  }

  /** Static DAO around a governance wrapper (tokens with hooks / legacy coins). */
  createDaoStaticForWrapper(wrappedToken: string, nativeToken: string): TxPayload {
    return this.factory("petra", "create_dao_static_for_wrapper", [
      address(wrappedToken),
      address(nativeToken),
    ]);
  }

  /** Router shortcut for DAO activation (launcher-born or heritage). */
  activateDao(governanceToken: string): TxPayload {
    return this.router("dao_setup", "activate_dao", [address(governanceToken)]);
  }

  // -------------------------------------------------------------------------
  // Curatorship (fast path: the DAO guardian/curator signs)
  // -------------------------------------------------------------------------

  /** Blesses a static DAO. Only the DAO guardian (curator) can call it. Irreversible. */
  blessDao(dao: string): TxPayload {
    return this.factory("charter", "bless_dao", [address(dao)]);
  }

  setCurator(newCurator: string): TxPayload {
    return this.factory("petra", "set_curator", [address(newCurator)]);
  }

  reassignCurator(dao: string, newCurator: string): TxPayload {
    return this.factory("petra", "reassign_curator", [
      address(dao),
      address(newCurator),
    ]);
  }

  // -------------------------------------------------------------------------
  // Factory admin
  // -------------------------------------------------------------------------

  setCreationFee(fee: string | number | bigint): TxPayload {
    return this.factory("petra", "set_creation_fee", [u64(fee)]);
  }

  setFeeReceiver(receiver: string): TxPayload {
    return this.factory("petra", "set_fee_receiver", [address(receiver)]);
  }

  setDefaultConfig(configKey: number, value: string | number | bigint): TxPayload {
    return this.factory("petra", "set_default_config", [u8(configKey), u64(value)]);
  }

  addDefaultBribeToken(token: string): TxPayload {
    return this.factory("petra", "add_default_bribe_token", [address(token)]);
  }

  removeDefaultBribeToken(token: string): TxPayload {
    return this.factory("petra", "remove_default_bribe_token", [address(token)]);
  }

  approveLauncher(launcher: string): TxPayload {
    return this.factory("petra", "approve_launcher", [address(launcher)]);
  }

  revokeLauncher(launcher: string): TxPayload {
    return this.factory("petra", "revoke_launcher", [address(launcher)]);
  }

  transferAdmin(newAdmin: string): TxPayload {
    return this.factory("petra", "transfer_admin", [address(newAdmin)]);
  }

  acceptAdmin(): TxPayload {
    return this.factory("petra", "accept_admin", []);
  }

  acceptAdminForDao(dao: string): TxPayload {
    return this.factory("petra", "accept_admin_for_dao", [address(dao)]);
  }

  claimTokenByAdmin(launcher: string, token: string): TxPayload {
    return this.factory("petra", "claim_token_by_admin", [
      address(launcher),
      address(token),
    ]);
  }

  unclaimToken(token: string): TxPayload {
    return this.factory("petra", "unclaim_token", [address(token)]);
  }

  // -------------------------------------------------------------------------
  // Locks (router wrappers; legacy::create_lock is not an entry function)
  // -------------------------------------------------------------------------

  createLock(governanceToken: string, amount: string | number | bigint, lockEpochs: string | number | bigint): TxPayload {
    return this.router("dao_staking", "create_lock", [
      address(governanceToken),
      u64(amount),
      u64(lockEpochs),
    ]);
  }

  increaseLockAmount(veToken: string, amount: string | number | bigint): TxPayload {
    return this.router("dao_staking", "increase_lock_amount", [
      address(veToken),
      u64(amount),
    ]);
  }

  increaseLockAmountFromNative(veToken: string, nativeAmount: string | number | bigint): TxPayload {
    return this.router("dao_staking", "increase_lock_amount_from_native", [
      address(veToken),
      u64(nativeAmount),
    ]);
  }

  withdrawAndUnwrap(veToken: string): TxPayload {
    return this.router("dao_staking", "withdraw_and_unwrap", [address(veToken)]);
  }

  extendLockup(veToken: string, additionalEpochs: string | number | bigint): TxPayload {
    return this.factory("legacy", "extend_lockup", [
      address(veToken),
      u64(additionalEpochs),
    ]);
  }

  mergeVeTokens(fromVe: string, intoVe: string): TxPayload {
    return this.factory("legacy", "merge", [address(fromVe), address(intoVe)]);
  }

  withdrawLock(veToken: string): TxPayload {
    return this.factory("legacy", "withdraw", [address(veToken)]);
  }

  compound(veToken: string): TxPayload {
    return this.factory("legacy", "compound", [address(veToken)]);
  }

  claimRewards(veToken: string): TxPayload {
    return this.factory("legacy", "claim_rewards", [address(veToken)]);
  }

  delegateVotingPower(veToken: string, delegate: string): TxPayload {
    return this.factory("legacy", "delegate_voting_power", [
      address(veToken),
      address(delegate),
    ]);
  }

  revokeDelegation(veToken: string): TxPayload {
    return this.factory("legacy", "revoke_delegation", [address(veToken)]);
  }

  /** Permissionless keeper: sweeps orphaned rebase of an expired lock to the DAO treasury. */
  sweepExpiredRebase(veToken: string): TxPayload {
    return this.factory("legacy", "sweep_expired_rebase", [address(veToken)]);
  }

  // -------------------------------------------------------------------------
  // Proposals (dao_router::dao_proposals wrappers)
  // -------------------------------------------------------------------------

  proposeTreasuryTransfer(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    assetAddress: string,
    recipient: string,
    amount: string | number | bigint,
  ): TxPayload {
    return this.router("dao_proposals", "propose_treasury_transfer", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      address(assetAddress),
      address(recipient),
      u64(amount),
    ]);
  }

  proposeNftTransfer(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    nftAddress: string,
    recipient: string,
  ): TxPayload {
    return this.router("dao_proposals", "propose_nft_transfer", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      address(nftAddress),
      address(recipient),
    ]);
  }

  proposeConfigChange(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    configKey: number,
    configValue: string | number | bigint,
  ): TxPayload {
    return this.router("dao_proposals", "propose_config_change", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      u8(configKey),
      u64(configValue),
    ]);
  }

  proposeGuardianUpdate(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    newGuardian: string,
  ): TxPayload {
    return this.router("dao_proposals", "propose_guardian_update", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      address(newGuardian),
    ]);
  }

  proposeGaugeAction(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    actionType: number,
    targetAddress: string,
    gaugeId: string | number | bigint,
  ): TxPayload {
    return this.router("dao_proposals", "propose_gauge_action", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      u8(actionType),
      address(targetAddress),
      u64(gaugeId),
    ]);
  }

  proposeModuleSetting(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    settingType: number,
    targetAddress: string,
    stringValue: string,
    boolValue: boolean,
  ): TxPayload {
    return this.router("dao_proposals", "propose_module_setting", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      u8(settingType),
      address(targetAddress),
      stringValue,
      boolValue,
    ]);
  }

  proposeBoostAction(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    actionType: number,
    collectionAddress: string,
    boostBps: string | number | bigint,
  ): TxPayload {
    return this.router("dao_proposals", "propose_boost_action", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      u8(actionType),
      address(collectionAddress),
      u64(boostBps),
    ]);
  }

  proposeScriptAllow(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    scriptId: string | number | bigint,
    add: boolean,
  ): TxPayload {
    return this.router("dao_proposals", "propose_script_allow", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      u64(scriptId),
      add,
    ]);
  }

  /** Type-8 script proposal (requires a guardian and the script allow-listed). */
  proposeScript(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    scriptId: string | number | bigint,
    argsCommitment: Bytes,
  ): TxPayload {
    return this.factory("herald", "propose_script", [
      address(veToken),
      address(dao),
      title,
      descriptionHash,
      u64(scriptId),
      argsCommitment,
    ]);
  }

  /**
   * Advanced: raw generic proposal. Prefer the typed wrappers above; this is
   * here for future proposal types without an SDK release.
   */
  proposeStandard(params: {
    veToken: string;
    dao: string;
    title: string;
    descriptionHash: Bytes;
    proposalType: number;
    proposalData: Bytes;
    actionRecipient: string;
    actionAmount: string | number | bigint;
    actionConfigKey: number;
    actionConfigValue: string | number | bigint;
    actionTargetAddress: string;
    eventTarget: string;
    eventAsset: string;
  }): TxPayload {
    return this.factory("herald", "propose_standard", [
      address(params.veToken),
      address(params.dao),
      params.title,
      params.descriptionHash,
      u8(params.proposalType),
      params.proposalData,
      address(params.actionRecipient),
      u64(params.actionAmount),
      u8(params.actionConfigKey),
      u64(params.actionConfigValue),
      address(params.actionTargetAddress),
      address(params.eventTarget),
      address(params.eventAsset),
    ]);
  }

  // -------------------------------------------------------------------------
  // Voting & execution
  // -------------------------------------------------------------------------

  castVote(
    veToken: string,
    dao: string,
    proposalId: string | number | bigint,
    support: 0 | 1 | 2,
  ): TxPayload {
    return this.factory("witness", "cast_vote", [
      address(veToken),
      address(dao),
      u64(proposalId),
      u8(support),
    ]);
  }

  queueProposal(dao: string, proposalId: string | number | bigint): TxPayload {
    return this.factory("anchor", "queue_proposal", [address(dao), u64(proposalId)]);
  }

  executeAction(dao: string, proposalId: string | number | bigint): TxPayload {
    return this.factory("anchor", "execute_action", [address(dao), u64(proposalId)]);
  }

  finalizeProposal(dao: string, proposalId: string | number | bigint): TxPayload {
    return this.factory("anchor", "finalize_proposal", [address(dao), u64(proposalId)]);
  }

  cancelProposal(dao: string, proposalId: string | number | bigint): TxPayload {
    return this.factory("anchor", "cancel_proposal", [address(dao), u64(proposalId)]);
  }

  publicCancelProposal(dao: string, proposalId: string | number | bigint): TxPayload {
    return this.factory("anchor", "public_cancel_proposal", [address(dao), u64(proposalId)]);
  }

  cancelExpiredProposal(dao: string, proposalId: string | number | bigint): TxPayload {
    return this.factory("anchor", "cancel_expired_proposal", [address(dao), u64(proposalId)]);
  }

  voteGauges(
    veToken: string,
    dao: string,
    gaugeIds: Array<string | number | bigint>,
    weights: Array<string | number | bigint>,
  ): TxPayload {
    return this.factory("zeal", "vote", [
      address(veToken),
      address(dao),
      u64Vector(gaugeIds),
      u64Vector(weights),
    ]);
  }

  claimGaugeEmission(
    dao: string,
    targetEpoch: string | number | bigint,
    gaugeId: string | number | bigint,
  ): TxPayload {
    return this.factory("zeal", "claim_gauge_emission", [
      address(dao),
      u64(targetEpoch),
      u64(gaugeId),
    ]);
  }

  // -------------------------------------------------------------------------
  // Bribes
  // -------------------------------------------------------------------------

  depositBribe(
    dao: string,
    epoch: string | number | bigint,
    gaugeId: string | number | bigint,
    token: string,
    amount: string | number | bigint,
  ): TxPayload {
    return this.factory("restore", "deposit_bribe", [
      address(dao),
      u64(epoch),
      u64(gaugeId),
      address(token),
      u64(amount),
    ]);
  }

  claimBribe(
    veToken: string,
    dao: string,
    epoch: string | number | bigint,
    gaugeId: string | number | bigint,
    token: string,
  ): TxPayload {
    return this.factory("restore", "claim_bribe", [
      address(veToken),
      address(dao),
      u64(epoch),
      u64(gaugeId),
      address(token),
    ]);
  }

  rolloverBribe(
    dao: string,
    pastEpoch: string | number | bigint,
    gaugeId: string | number | bigint,
    token: string,
  ): TxPayload {
    return this.factory("restore", "rollover_bribe", [
      address(dao),
      u64(pastEpoch),
      u64(gaugeId),
      address(token),
    ]);
  }

  // -------------------------------------------------------------------------
  // Gauge staking & NFT boosts
  // -------------------------------------------------------------------------

  stakeGauge(gauge: string, amount: string | number | bigint): TxPayload {
    return this.factory("foundry", "stake", [address(gauge), u64(amount)]);
  }

  withdrawGauge(gauge: string, amount: string | number | bigint): TxPayload {
    return this.factory("foundry", "withdraw", [address(gauge), u64(amount)]);
  }

  claimGaugeReward(gauge: string): TxPayload {
    return this.factory("foundry", "get_reward", [address(gauge)]);
  }

  applyBoost(gauge: string, nftAddresses: string[]): TxPayload {
    return this.factory("foundry", "apply_boost", [
      address(gauge),
      addresses(nftAddresses),
    ]);
  }

  unboost(gauge: string): TxPayload {
    return this.factory("foundry", "unboost", [address(gauge)]);
  }

  /** Permissionless: re-prices a user's stored boost against the current registry. */
  syncBoost(gauge: string, user: string): TxPayload {
    return this.factory("foundry", "sync_boost", [address(gauge), address(user)]);
  }

  // -------------------------------------------------------------------------
  // Legacy V1 NFT wrappers (dao_router)
  // -------------------------------------------------------------------------

  wrapAndBoost(
    gauge: string,
    creatorAddresses: string[],
    collectionNames: string[],
    tokenNames: string[],
    propertyVersions: Array<string | number | bigint>,
  ): TxPayload {
    return this.router("dao_boost", "wrap_and_boost", [
      address(gauge),
      addresses(creatorAddresses),
      collectionNames,
      tokenNames,
      u64Vector(propertyVersions),
    ]);
  }

  unboostAndUnwrap(gauge: string): TxPayload {
    return this.router("dao_boost", "unboost_and_unwrap", [address(gauge)]);
  }

  // -------------------------------------------------------------------------
  // Permissionless keepers
  // -------------------------------------------------------------------------

  advanceEpoch(dao: string): TxPayload {
    return this.factory("jubilee", "advance_epoch", [address(dao)]);
  }

  harvestPoelRewards(dao: string): TxPayload {
    return this.factory("harvest", "harvest_poel_rewards", [address(dao)]);
  }
}
