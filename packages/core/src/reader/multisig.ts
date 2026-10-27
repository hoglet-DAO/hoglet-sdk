import {
  ReaderContext,
  asArray,
  asNumber,
  asString,
  isZeroAddress,
  pick,
} from "./context.js";
import type {
  LegacyMultisigDetails,
  LegacyProposalDetails,
  MultisigAccountInfo,
  MultisigConfig,
  MultisigTransactionInfo,
  MultisigVote,
} from "../types.js";

const FRAMEWORK = "0x1";

function optionBytes(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value === "" || value === "0x" ? null : value;
  if (Array.isArray(value)) return value.length > 0 ? optionBytes(value[0]) : null;
  if (typeof value === "object") {
    const vec = (value as { vec?: unknown }).vec;
    if (Array.isArray(vec)) return vec.length > 0 ? optionBytes(vec[0]) : null;
    const nested = (value as { value?: unknown }).value;
    if (nested !== undefined) return optionBytes(nested);
  }
  return null;
}

function mapEntries(value: unknown): Array<{ key: unknown; value: unknown }> {
  const source =
    value && typeof value === "object" && "data" in value
      ? (value as { data?: unknown }).data
      : value;
  return Array.isArray(source)
    ? (source as Array<{ key: unknown; value: unknown }>)
    : [];
}

function hexToText(value: string): string {
  const hex = value.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) return value;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return value;
  }
}

export class MultisigReader extends ReaderContext {
  private registry(fn: string): string {
    return `${this.config.contracts.multisigV2}::multisig_registry::${fn}`;
  }

  private admin(fn: string): string {
    return `${this.config.contracts.multisigV2}::multisig_admin::${fn}`;
  }

  private native(fn: string): string {
    return `${FRAMEWORK}::multisig_account::${fn}`;
  }

  private legacy(fn: string): string {
    return `${this.config.contracts.multisigLegacy}::multisig::${fn}`;
  }

  /** Predicts the address of the next native multisig created by `creator`. */
  async getNextMultisigAddress(creator: string): Promise<string | null> {
    const raw = await this.safeViewOne(
      this.native("get_next_multisig_account_address"),
      [creator],
    );
    const address = asString(raw);
    return isZeroAddress(address) ? null : address;
  }

  async getMultisigAccount(address: string): Promise<MultisigAccountInfo> {
    const exists =
      (await this.safeViewOne(this.native("account_exists"), [address])) === true;

    if (!exists) {
      return {
        address,
        exists: false,
        owners: [],
        threshold: 0,
        timeoutSeconds: 0,
        nextSequenceNumber: 0,
        lastResolvedSequenceNumber: 0,
        metadata: {},
      };
    }

    const [ownersRaw, thresholdRaw, timeoutRaw, nextRaw, lastRaw, metadataRaw] =
      await Promise.all([
        this.safeViewOne(this.native("owners"), [address]),
        this.safeViewOne(this.native("num_signatures_required"), [address]),
        this.safeViewOne(this.native("timeout_duration"), [address]),
        this.safeViewOne(this.native("next_sequence_number"), [address]),
        this.safeViewOne(this.native("last_resolved_sequence_number"), [address]),
        this.safeViewOne(this.native("metadata"), [address]),
      ]);

    const metadata: Record<string, string> = {};
    for (const entry of mapEntries(metadataRaw)) {
      const key = asString(entry.key);
      if (key) metadata[key] = hexToText(asString(entry.value));
    }

    return {
      address,
      exists: true,
      owners: asArray<string>(ownersRaw),
      threshold: asNumber(thresholdRaw ?? 0),
      timeoutSeconds: asNumber(timeoutRaw ?? 0),
      nextSequenceNumber: asNumber(nextRaw ?? 0),
      lastResolvedSequenceNumber: asNumber(lastRaw ?? 0),
      metadata,
    };
  }

  async getUserMultisigs(user: string): Promise<string[]> {
    const raw = await this.safeViewOne(this.registry("get_user_multisigs"), [
      user,
    ]);
    return asArray<string>(raw);
  }

  async isMultisigOwner(user: string, multisigAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(this.native("is_owner"), [
      user,
      multisigAddress,
    ]);
    return raw === true;
  }

  async getMultisigConfig(): Promise<MultisigConfig> {
    const [adminRaw, feeRaw, treasuryRaw] = await Promise.all([
      this.safeViewOne(this.admin("get_admin"), []),
      this.safeViewOne(this.admin("get_creation_fee"), []),
      this.safeViewOne(this.admin("get_treasury_address"), []),
    ]);
    return {
      admin: asString(adminRaw),
      creationFeeRaw: asString(feeRaw ?? "0"),
      treasury: asString(treasuryRaw),
    };
  }

  async getMultisigPending(
    address: string,
  ): Promise<MultisigTransactionInfo[]> {
    const account = await this.getMultisigAccount(address);
    if (!account.exists) return [];

    const rows = await this.viewList<Record<string, unknown>>(
      this.native("get_pending_transactions"),
      [address],
    );
    return rows.map((row, index) =>
      this.parseTransaction(row, account.lastResolvedSequenceNumber + 1 + index),
    );
  }

  async getMultisigTransaction(
    address: string,
    sequenceNumber: string | number | bigint,
  ): Promise<MultisigTransactionInfo | null> {
    const raw = await this.safeViewOne<Record<string, unknown>>(
      this.native("get_transaction"),
      [address, String(sequenceNumber)],
    );
    if (!raw) return null;
    return this.parseTransaction(raw, asNumber(sequenceNumber));
  }

  private parseTransaction(
    row: Record<string, unknown>,
    sequenceNumber: number,
  ): MultisigTransactionInfo {
    const votes: MultisigVote[] = mapEntries(pick(row, "votes")).map((vote) => ({
      owner: asString(vote.key),
      approved: vote.value === true,
    }));
    return {
      sequenceNumber,
      creator: asString(pick(row, "creator")),
      creationTimeSecs: asNumber(pick(row, "creation_time_secs", "creationTimeSecs") ?? 0),
      payload: optionBytes(pick(row, "payload")),
      payloadHash: optionBytes(pick(row, "payload_hash", "payloadHash")),
      approvals: votes.filter((vote) => vote.approved).length,
      rejections: votes.filter((vote) => !vote.approved).length,
      votes,
    };
  }

  // -------------------------------------------------------------------------
  // Legacy custom multisig (read-only compatibility)
  // -------------------------------------------------------------------------

  async getLegacyMultisigIds(user: string): Promise<number[]> {
    const raw = await this.safeViewOne(this.legacy("get_multisig_ids_for_address"), [
      user,
    ]);
    return asArray<unknown>(raw).map((id) => asNumber(id));
  }

  async getLegacyMultisigsForAddress(
    user: string,
  ): Promise<LegacyMultisigDetails[]> {
    const rows = await this.viewList<Record<string, unknown>>(
      this.legacy("get_multisig_details_for_address"),
      [user],
    );
    return rows.map((row) => ({
      id: asNumber(pick(row, "id") ?? 0),
      participants: asArray<string>(pick(row, "participants")),
      name: asString(pick(row, "name")),
      approvalThreshold: asNumber(pick(row, "approval_threshold") ?? 0),
      cancellationThreshold: asNumber(pick(row, "cancellation_threshold") ?? 0),
      address: asString(pick(row, "address")),
    }));
  }

  async getLegacyMultisigDetails(
    multisigId: string | number | bigint,
  ): Promise<LegacyMultisigDetails | null> {
    const result = await this.rpc.view<unknown>(
      this.legacy("get_multisig_details"),
      [String(multisigId)],
    );
    if (result.length < 5) return null;
    return {
      id: asNumber(multisigId),
      participants: asArray<string>(result[0]),
      name: asString(result[1]),
      approvalThreshold: asNumber(result[2]),
      cancellationThreshold: asNumber(result[3]),
      address: asString(result[4]),
    };
  }

  async getLegacyPendingProposals(
    multisigId: string | number | bigint,
  ): Promise<LegacyProposalDetails[]> {
    const rows = await this.viewList<Record<string, unknown>>(
      this.legacy("get_pending_proposals_details"),
      [String(multisigId)],
    );
    return rows.map((row) => ({
      proposalId: asNumber(pick(row, "proposal_id") ?? 0),
      creator: asString(pick(row, "creator")),
      posted: pick(row, "posted") === true,
      approvalVotes: asNumber(pick(row, "approval_votes") ?? 0),
      cancellationVotes: asNumber(pick(row, "cancellation_votes") ?? 0),
      addParticipants: asArray<string>(pick(row, "add_participants")),
      removeParticipants: asArray<string>(pick(row, "remove_participants")),
      withdrawTokens: asArray<unknown>(pick(row, "withdraw_tokens")),
      withdrawFAs: asArray<unknown>(pick(row, "withdraw_fa")),
      withdrawCoins: asArray<unknown>(pick(row, "withdraw_coins")),
      withdrawDigitalAssets: asArray<unknown>(pick(row, "withdraw_digital_assets")),
    }));
  }
}
