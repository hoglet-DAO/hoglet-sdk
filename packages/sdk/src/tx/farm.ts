import { TxBuilderBase } from "./base.js";
import { address, u64, type TxPayload } from "../payload.js";

export interface FarmPoolRef {
  /** Address that registered the pool. */
  creator: string;
  stakeToken: string;
  rewardToken: string;
}

export interface StakeFarmParams extends FarmPoolRef {
  amount: string | number | bigint;
}

export interface RegisterFarmPoolParams {
  stakeToken: string;
  rewardToken: string;
  rewardAmount: string | number | bigint;
  duration: string | number | bigint;
}

export interface DepositFarmRewardsParams extends FarmPoolRef {
  amount: string | number | bigint;
}

export interface BoostFarmParams extends FarmPoolRef {
  collectionOwner: string;
  collectionName: string;
  tokenName: string;
  propertyVersion?: string | number | bigint;
}

export class FarmTx extends TxBuilderBase {
  stakeFarm(params: StakeFarmParams): TxPayload {
    return this.ammFn("router_stake", "stake_fa", [
      address(params.creator),
      address(params.stakeToken),
      address(params.rewardToken),
      u64(params.amount),
    ]);
  }

  unstakeFarm(params: StakeFarmParams): TxPayload {
    return this.ammFn("router_stake", "unstake_fa", [
      address(params.creator),
      address(params.stakeToken),
      address(params.rewardToken),
      u64(params.amount),
    ]);
  }

  harvestFarm(pool: FarmPoolRef): TxPayload {
    return this.ammFn("router_stake", "harvest_fa", [
      address(pool.creator),
      address(pool.stakeToken),
      address(pool.rewardToken),
    ]);
  }

  /** Creates a farm pool and seeds its reward budget. */
  registerFarmPool(params: RegisterFarmPoolParams): TxPayload {
    return this.ammFn("router_stake", "register_pool_fa", [
      address(params.stakeToken),
      address(params.rewardToken),
      u64(params.rewardAmount),
      u64(params.duration),
    ]);
  }

  depositFarmRewards(params: DepositFarmRewardsParams): TxPayload {
    return this.ammFn("router_stake", "deposit_reward_assets", [
      address(params.creator),
      address(params.stakeToken),
      address(params.rewardToken),
      u64(params.amount),
    ]);
  }

  boostFarm(params: BoostFarmParams): TxPayload {
    return this.ammFn("router_stake", "boost", [
      address(params.creator),
      address(params.stakeToken),
      address(params.rewardToken),
      address(params.collectionOwner),
      params.collectionName,
      params.tokenName,
      u64(params.propertyVersion ?? 0),
    ]);
  }

  removeFarmBoost(pool: FarmPoolRef): TxPayload {
    return this.ammFn("router_stake", "remove_boost", [
      address(pool.creator),
      address(pool.stakeToken),
      address(pool.rewardToken),
    ]);
  }
}
