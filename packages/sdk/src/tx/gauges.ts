import { TxBuilderBase } from "./base.js";
import {
  address,
  addresses,
  u64,
  u64Vector,
  type TxPayload,
} from "../payload.js";

export class GaugesTx extends TxBuilderBase {
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
