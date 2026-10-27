import { ReaderContext, asNumber, asString } from "./context.js";
import type { FarmPoolInfo, FarmPosition } from "../types.js";

export interface FarmPoolRef {
  creator: string;
  stakeToken: string;
  rewardToken: string;
}

/** Reads swap-farm pools and positions (`stake_fa` at the AMM address). */
export class FarmReader extends ReaderContext {
  async getFarmPool(ref: FarmPoolRef): Promise<FarmPoolInfo> {
    const key = [ref.creator, ref.stakeToken, ref.rewardToken];
    const [
      exists,
      finished,
      rewardPerSecRaw,
      startTimestamp,
      endTimestamp,
      totalStakedRaw,
      totalBoostedRaw,
    ] = await Promise.all([
      this.safeViewOne(this.ammFn("stake_fa", "pool_exists"), key),
      this.safeViewOne(this.ammFn("stake_fa", "is_finished"), key),
      this.safeViewOne(this.ammFn("stake_fa", "get_reward_per_sec"), key),
      this.safeViewOne(this.ammFn("stake_fa", "get_start_timestamp"), key),
      this.safeViewOne(this.ammFn("stake_fa", "get_end_timestamp"), key),
      this.safeViewOne(this.ammFn("stake_fa", "get_pool_total_stake"), key),
      this.safeViewOne(this.ammFn("stake_fa", "get_pool_total_boosted"), key),
    ]);

    return {
      ...ref,
      exists: exists === true,
      finished: finished === true,
      rewardPerSecRaw: asString(rewardPerSecRaw ?? "0"),
      startTimestamp: asNumber(startTimestamp ?? 0),
      endTimestamp: asNumber(endTimestamp ?? 0),
      totalStakedRaw: asString(totalStakedRaw ?? "0"),
      totalBoostedRaw: asString(totalBoostedRaw ?? "0"),
    };
  }

  async getFarmPosition(
    ref: FarmPoolRef,
    user: string,
  ): Promise<FarmPosition> {
    const key = [ref.creator, ref.stakeToken, ref.rewardToken, user];
    const [stakedRaw, pendingRewardsRaw, boostedRaw, isBoosted] =
      await Promise.all([
        this.safeViewOne(this.ammFn("stake_fa", "get_user_stake_or_zero"), key),
        this.safeViewOne(this.ammFn("stake_fa", "get_pending_user_rewards"), key),
        this.safeViewOne(this.ammFn("stake_fa", "get_user_boosted"), key),
        this.safeViewOne(this.ammFn("stake_fa", "is_boosted"), key),
      ]);

    return {
      ...ref,
      user,
      stakedRaw: asString(stakedRaw ?? "0"),
      pendingRewardsRaw: asString(pendingRewardsRaw ?? "0"),
      boostedRaw: asString(boostedRaw ?? "0"),
      isBoosted: isBoosted === true,
    };
  }
}
