import { TxBuilderBase } from "./base.js";
import { address, u64, u8, type TxPayload } from "../payload.js";

export class DaoTx extends TxBuilderBase {
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

  /**
   * Wraps a DAO's native Coin balance into its paired FA
   * (`dao_factory::anchor::wrap<CoinType>`). Live on mainnet; not deployed on
   * testnet at the time of wiring.
   */
  wrapDaoCoin(daoAddress: string, coinType: string): TxPayload {
    return this.factory("anchor", "wrap", [address(daoAddress)], [coinType]);
  }
}
