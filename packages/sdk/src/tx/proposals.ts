import { TxBuilderBase } from "./base.js";
import { address, u64, u8, type Bytes, type TxPayload } from "../payload.js";

export class ProposalsTx extends TxBuilderBase {
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

  /**
   * Treasury transfer paid from a native Coin via its paired FA
   * (`propose_treasury_transfer_coin<CoinType>`). Source is wired; the
   * deployment may lag behind (not in the on-chain ABI yet).
   */
  proposeTreasuryTransferCoin(
    veToken: string,
    dao: string,
    title: string,
    descriptionHash: Bytes,
    recipient: string,
    amount: string | number | bigint,
    coinType: string,
  ): TxPayload {
    return this.router(
      "dao_proposals",
      "propose_treasury_transfer_coin",
      [
        address(veToken),
        address(dao),
        title,
        descriptionHash,
        address(recipient),
        u64(amount),
      ],
      [coinType],
    );
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

}
