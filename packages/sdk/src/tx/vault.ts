import { toBytesHex } from "@hoglet/core";
import { TxBuilderBase } from "./base.js";
import { address, u8, type Bytes, type TxPayload } from "../payload.js";

export interface DeployAutonomousContractParams {
  /** Package name; namespaces the address. 1..=64 UTF-8 bytes. */
  label: string;
  /** Compiled package metadata (`vector<u8>`), raw hex or bytes. */
  metadata: Bytes;
  /** Compiled module bytecodes (`vector<vector<u8>>`). */
  modules: Bytes[];
  /** Admin/owner. `0x0` deploys and freezes in the same transaction. */
  owner: string;
}

export interface UpgradeContractParams {
  contract: string;
  metadata: Bytes;
  modules: Bytes[];
}

export interface DonateEoaToDaoParams {
  /** Address that will govern the donated EOA (DAO, multisig, timelock...). */
  daoAdmin: string;
  signerCapabilitySigBytes: Bytes;
  accountScheme: number;
  accountPublicKeyBytes: Bytes;
}

function binaryArg(value: Bytes): string {
  if (value instanceof Uint8Array) return toBytesHex(value);
  const text = value.trim();
  if (/^0x[0-9a-fA-F]*$/.test(text)) {
    if (text.length % 2 !== 0) {
      throw new Error(`Invalid hex byte vector length: ${text}`);
    }
    return text.toLowerCase();
  }
  return toBytesHex(text);
}

function labelArg(label: string): string {
  const length = new TextEncoder().encode(label).length;
  if (length === 0 || length > 64) {
    throw new Error("label must be 1..=64 UTF-8 bytes");
  }
  return toBytesHex(label);
}

function binaryListArg(values: Bytes[]): string[] {
  if (values.length === 0) throw new Error("modules must not be empty");
  return values.map(binaryArg);
}

export class VaultTx extends TxBuilderBase {
  // -------------------------------------------------------------------------
  // Contract vault (dao_contracts_vault::vault)
  // -------------------------------------------------------------------------

  /**
   * Deploys a package into an Autonomous Resource Account.
   *
   * Use `HogletReader.predictNextContractAddress(creator, label)` first: the
   * compiled package must be built with that address as its named address.
   */
  deployAutonomousContract(
    params: DeployAutonomousContractParams,
  ): TxPayload {
    return this.vaultFn("vault", "deploy_autonomous_contract", [
      labelArg(params.label),
      binaryArg(params.metadata),
      binaryListArg(params.modules),
      address(params.owner),
    ]);
  }

  upgradeContract(params: UpgradeContractParams): TxPayload {
    return this.vaultFn("vault", "upgrade_contract", [
      address(params.contract),
      binaryArg(params.metadata),
      binaryListArg(params.modules),
    ]);
  }

  transferContractAdmin(
    contractAddress: string,
    newAdmin: string,
  ): TxPayload {
    return this.vaultFn("vault", "transfer_admin", [
      address(contractAddress),
      address(newAdmin),
    ]);
  }

  /** Irreversible: destroys the signer capability and writes the tombstone. */
  renounceContract(contractAddress: string): TxPayload {
    return this.vaultFn("vault", "renounce_contract", [
      address(contractAddress),
    ]);
  }

  /** Hands an EOA to governance; the key burn itself happens in the wallet. */
  donateEoaToDao(params: DonateEoaToDaoParams): TxPayload {
    return this.vaultFn("vault", "donate_eoa_to_dao", [
      address(params.daoAdmin),
      binaryArg(params.signerCapabilitySigBytes),
      u8(params.accountScheme),
      binaryArg(params.accountPublicKeyBytes),
    ]);
  }

  cancelEoaDelegation(eoaAddress: string): TxPayload {
    return this.vaultFn("vault", "cancel_eoa_delegation", [
      address(eoaAddress),
    ]);
  }
}
