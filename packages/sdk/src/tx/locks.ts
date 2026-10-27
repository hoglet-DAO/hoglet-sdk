import { TxBuilderBase } from "./base.js";
import { address, u64, type TxPayload } from "../payload.js";

export class LocksTx extends TxBuilderBase {
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

}
