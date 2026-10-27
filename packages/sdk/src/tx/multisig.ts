import { toBytesHex } from "@hoglet/core";
import { TxBuilderBase } from "./base.js";
import { address, u64, type Bytes, type TxPayload } from "../payload.js";

const DEFAULT_TIMEOUT_SECONDS = 7 * 24 * 60 * 60;

export interface CreateMultisigParams {
  additionalOwners: string[];
  numSignaturesRequired: string | number | bigint;
  /** Optional on-chain metadata (e.g. `{ name: "Treasury" }`). */
  metadata?: Record<string, string>;
  timeoutDuration?: string | number | bigint;
}

export interface CreateMultisigTransactionParams {
  multisig: string;
  /** BCS-encoded entry-function payload to store on-chain. */
  payload: Bytes;
}

export interface MultisigSequenceParams {
  multisig: string;
  sequenceNumber: string | number | bigint;
}

function bytesArg(value: Bytes): string {
  if (value instanceof Uint8Array) return toBytesHex(value);
  const text = value.trim();
  if (/^0x[0-9a-fA-F]*$/.test(text)) return text.toLowerCase();
  return toBytesHex(text);
}

export class MultisigTx extends TxBuilderBase {
  private registry(fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.multisigV2}::multisig_registry::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  /**
   * Creates a native multisig through the registry wrapper (charges the
   * on-chain creation fee) and registers it for the creator.
   */
  createMultisig(params: CreateMultisigParams): TxPayload {
    const keys = Object.keys(params.metadata ?? {});
    const values = keys.map((key) => toBytesHex(params.metadata![key]!));
    return this.registry("create_and_register", [
      params.additionalOwners.map(address),
      u64(params.numSignaturesRequired),
      keys,
      values,
      u64(params.timeoutDuration ?? DEFAULT_TIMEOUT_SECONDS),
    ]);
  }

  importMultisig(multisigAddress: string): TxPayload {
    return this.registry("import_multisig", [address(multisigAddress)]);
  }

  removeMultisig(multisigAddress: string): TxPayload {
    return this.registry("remove_multisig", [address(multisigAddress)]);
  }

  /** Stores a payload on-chain; owners then approve it. */
  createMultisigTransaction(
    params: CreateMultisigTransactionParams,
  ): TxPayload {
    return this.frameworkFn("multisig_account", "create_transaction", [
      address(params.multisig),
      bytesArg(params.payload),
    ]);
  }

  createMultisigTransactionHash(
    params: CreateMultisigTransactionParams & { payload: Bytes },
  ): TxPayload {
    const hash = bytesArg(params.payload);
    if (hash.length !== 66) {
      throw new Error("payload hash must be 32 bytes (0x + 64 hex chars)");
    }
    return this.frameworkFn("multisig_account", "create_transaction_with_hash", [
      address(params.multisig),
      hash,
    ]);
  }

  approveMultisigTransaction(params: MultisigSequenceParams): TxPayload {
    return this.frameworkFn("multisig_account", "approve_transaction", [
      address(params.multisig),
      u64(params.sequenceNumber),
    ]);
  }

  rejectMultisigTransaction(params: MultisigSequenceParams): TxPayload {
    return this.frameworkFn("multisig_account", "reject_transaction", [
      address(params.multisig),
      u64(params.sequenceNumber),
    ]);
  }

  voteMultisigTransaction(
    params: MultisigSequenceParams & { approved: boolean },
  ): TxPayload {
    return this.frameworkFn("multisig_account", "vote_transaction", [
      address(params.multisig),
      u64(params.sequenceNumber),
      params.approved,
    ]);
  }

  /**
   * The remaining builders are `entry fun` gated on the multisig account
   * signer: submit them as the payload of a multisig transaction, not from an
   * owner's wallet. Execution itself is a multi-ed25519 multisig transaction.
   */
  addMultisigOwners(
    owners: string[],
    newThreshold: string | number | bigint,
  ): TxPayload {
    return this.frameworkFn(
      "multisig_account",
      "add_owners_and_update_signatures_required",
      [owners.map(address), u64(newThreshold)],
    );
  }

  removeMultisigOwners(owners: string[]): TxPayload {
    return this.frameworkFn("multisig_account", "remove_owners", [
      owners.map(address),
    ]);
  }

  swapMultisigOwner(from: string, to: string): TxPayload {
    return this.frameworkFn("multisig_account", "swap_owner", [
      address(from),
      address(to),
    ]);
  }

  updateMultisigSignaturesRequired(
    threshold: string | number | bigint,
  ): TxPayload {
    return this.frameworkFn("multisig_account", "update_signatures_required", [
      u64(threshold),
    ]);
  }

  updateMultisigMetadata(metadata: Record<string, string>): TxPayload {
    const keys = Object.keys(metadata);
    return this.frameworkFn("multisig_account", "update_metadata", [
      keys,
      keys.map((key) => toBytesHex(metadata[key]!)),
    ]);
  }

  updateMultisigTimeout(seconds: string | number | bigint): TxPayload {
    return this.frameworkFn("multisig_account", "update_timeout_duration", [
      u64(seconds),
    ]);
  }

  /** Owner-callable: drops a rejected transaction after timeout/rejections. */
  executeRejectedMultisigTransaction(multisigAddress: string): TxPayload {
    return this.frameworkFn(
      "multisig_account",
      "execute_rejected_transaction",
      [address(multisigAddress)],
    );
  }
}
