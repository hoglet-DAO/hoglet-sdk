import {
  ReaderContext,
  asNumber,
  asString,
  isZeroAddress,
  pick,
} from "./context.js";
import { toBytesHex } from "../format.js";
import type {
  ContractControl,
  ManagedContractItem,
  VaultSecurityStatus,
} from "../types.js";

const VAULT_STATUSES: VaultSecurityStatus[] = [
  "unmanaged",
  "permanently_renounced",
  "dao_governed",
  "hazard_key_still_active",
];

function vaultStatusName(value: unknown): VaultSecurityStatus {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < VAULT_STATUSES.length
    ? VAULT_STATUSES[index]!
    : "unknown";
}

export class VaultReader extends ReaderContext {
  async getContractAdmin(contractAddress: string): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "get_contract_admin"),
      [contractAddress],
    );
    const admin = asString(raw);
    return isZeroAddress(admin) ? null : admin;
  }

  async getContractCreator(contractAddress: string): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "get_contract_creator"),
      [contractAddress],
    );
    const creator = asString(raw);
    return isZeroAddress(creator) ? null : creator;
  }

  async isContractRenounced(contractAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "is_contract_renounced"),
      [contractAddress],
    );
    return raw === true;
  }

  async isCryptographicallyFrozen(
    contractAddress: string,
  ): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "is_cryptographically_frozen"),
      [contractAddress],
    );
    return raw === true;
  }

  async isFactoryManaged(contractAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "is_factory_managed"),
      [contractAddress],
    );
    return raw === true;
  }

  async isEoaContract(contractAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "is_eoa_contract"),
      [contractAddress],
    );
    return raw === true;
  }

  async getEoaProxy(eoaAddress: string): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "get_eoa_proxy"),
      [eoaAddress],
    );
    const proxy = asString(raw);
    return isZeroAddress(proxy) ? null : proxy;
  }

  async isEoaKeyAnnihilated(eoaAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "is_eoa_key_annihilated"),
      [eoaAddress],
    );
    return raw === true;
  }

  async isEoaPermanentlyImmutable(eoaAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "is_eoa_permanently_immutable"),
      [eoaAddress],
    );
    return raw === true;
  }

  async getEoaSecurityStatus(
    eoaAddress: string,
  ): Promise<VaultSecurityStatus> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "get_eoa_security_status"),
      [eoaAddress],
    );
    return vaultStatusName(raw);
  }

  /**
   * Aggregated report for what actually controls an address. Read this instead
   * of treating `isContractRenounced` as "immutable": a tombstone exists even
   * when the EOA key is still alive.
   */
  async getContractControl(
    contractAddress: string,
  ): Promise<ContractControl> {
    const [
      isFactoryManaged,
      isRenounced,
      isCryptographicallyFrozen,
      isPermanentlyImmutable,
      isKeyAnnihilated,
      isEoa,
      admin,
      creator,
      eoaProxy,
      securityStatus,
    ] = await Promise.all([
      this.isFactoryManaged(contractAddress),
      this.isContractRenounced(contractAddress),
      this.isCryptographicallyFrozen(contractAddress),
      this.isEoaPermanentlyImmutable(contractAddress),
      this.isEoaKeyAnnihilated(contractAddress),
      this.isEoaContract(contractAddress),
      this.getContractAdmin(contractAddress),
      this.getContractCreator(contractAddress),
      this.getEoaProxy(contractAddress),
      this.getEoaSecurityStatus(contractAddress),
    ]);

    let note: string;
    if (!isFactoryManaged) {
      note =
        "Address is not managed by dao_contracts_vault. Control cannot be proven from the vault; inspect the account authentication key and module capabilities directly.";
    } else if (securityStatus === "hazard_key_still_active") {
      note =
        "HAZARD: the private key (or a rotation/signer-capability offer) is still active. The renounce is NOT effective.";
    } else if (isCryptographicallyFrozen || securityStatus === "permanently_renounced") {
      note =
        "Permanently renounced: the signer capability was destroyed and, for resource accounts, the self-offer revoked. The hosted package can never be upgraded again.";
    } else if (securityStatus === "dao_governed") {
      note =
        "Managed by the vault. 'dao_governed' means the vault holds the capability; check who `admin` is — a plain EOA admin is a single signer, not collective governance.";
    } else {
      note = "Managed address without a final renouncement. Admin can still upgrade or transfer control.";
    }

    return {
      contractAddress,
      isFactoryManaged,
      isRenounced,
      isCryptographicallyFrozen,
      isPermanentlyImmutable,
      isKeyAnnihilated,
      isEoa,
      admin,
      creator,
      eoaProxy,
      securityStatus,
      note,
    };
  }

  async getVaultTotalContracts(): Promise<number> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "get_total_contracts"),
      [],
    );
    return asNumber(raw ?? 0);
  }

  async getVaultContractsPage(
    offset = 0,
    limit = 50,
  ): Promise<ManagedContractItem[]> {
    const raw = await this.viewList<Record<string, unknown>>(
      this.vaultFn("vault", "get_contracts_page"),
      [String(offset), String(limit)],
    );
    return raw.map((item) => ({
      contractAddress: asString(
        pick(item, "contract_address", "contractAddress"),
      ),
      creator: asString(pick(item, "creator")),
      admin: asString(pick(item, "admin")),
      isResourceAccount:
        pick(item, "is_resource_account", "isResourceAccount") === true,
      isRenounced: pick(item, "is_renounced", "isRenounced") === true,
    }));
  }

  async getContractsByCreator(
    creatorAddress: string,
    limit = 50,
  ): Promise<ManagedContractItem[]> {
    const raw = await this.viewList<Record<string, unknown>>(
      this.vaultFn("vault", "get_contracts_by_creator"),
      [creatorAddress, String(limit)],
    );
    return raw.map((item) => ({
      contractAddress: asString(
        pick(item, "contract_address", "contractAddress"),
      ),
      creator: asString(pick(item, "creator")),
      admin: asString(pick(item, "admin")),
      isResourceAccount:
        pick(item, "is_resource_account", "isResourceAccount") === true,
      isRenounced: pick(item, "is_renounced", "isRenounced") === true,
    }));
  }

  /** Predicts the address `deploy_autonomous_contract` will publish to. */
  async predictNextContractAddress(
    creatorAddress: string,
    label: string,
  ): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "predict_next_contract_address"),
      [creatorAddress, toBytesHex(label)],
    );
    const predicted = asString(raw);
    return isZeroAddress(predicted) ? null : predicted;
  }

  async predictEoaProxyAddress(
    eoaAddress: string,
  ): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.vaultFn("vault", "predict_eoa_proxy_address"),
      [eoaAddress],
    );
    const proxy = asString(raw);
    return isZeroAddress(proxy) ? null : proxy;
  }
}
