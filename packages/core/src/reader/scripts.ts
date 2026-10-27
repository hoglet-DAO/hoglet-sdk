import { ReaderContext, asNumber, asString } from "./context.js";

export interface ScriptInfo {
  scriptId: number;
  executionHash: string | null;
  sourceCid: string | null;
  hasArgs: boolean;
  audited: boolean;
}

export interface ScriptLibraryConfig {
  admin: string;
  feeRaw: string;
  feeReceiver: string;
}

/** `dao_scripts::library` + `dao_scripts::vault` reads. */
export class ScriptsReader extends ReaderContext {
  private library(fn: string): string {
    return `${this.config.contracts.daoScripts}::library::${fn}`;
  }

  private scriptVault(fn: string): string {
    return `${this.config.contracts.daoScripts}::vault::${fn}`;
  }

  async getScriptCount(): Promise<number> {
    const raw = await this.safeViewOne(this.library("get_count"), []);
    return asNumber(raw ?? 0);
  }

  async getScript(scriptId: string | number | bigint): Promise<ScriptInfo> {
    const id = String(scriptId);
    const [hashRaw, cidRaw, hasArgs, audited] = await Promise.all([
      this.safeViewOne(this.library("get_execution_hash"), [id]),
      this.safeViewOne(this.library("get_source_cid"), [id]),
      this.safeViewOne(this.library("has_args"), [id]),
      this.safeViewOne(this.library("is_audited"), [id]),
    ]);
    return {
      scriptId: asNumber(scriptId),
      executionHash: hashRaw ? asString(hashRaw) : null,
      sourceCid: cidRaw ? asString(cidRaw) : null,
      hasArgs: hasArgs === true,
      audited: audited === true,
    };
  }

  /** Per-DAO allow-list state (`dao_scripts::vault::is_approved`). */
  async isScriptApproved(
    daoAddress: string,
    scriptId: string | number | bigint,
  ): Promise<boolean> {
    const raw = await this.safeViewOne(this.scriptVault("is_approved"), [
      daoAddress,
      String(scriptId),
    ]);
    return raw === true;
  }

  async getLibraryConfig(): Promise<ScriptLibraryConfig> {
    const [adminRaw, feeRaw, receiverRaw] = await Promise.all([
      this.safeViewOne(this.library("get_admin"), []),
      this.safeViewOne(this.library("get_fee"), []),
      this.safeViewOne(this.library("get_fee_receiver"), []),
    ]);
    return {
      admin: asString(adminRaw),
      feeRaw: asString(feeRaw ?? "0"),
      feeReceiver: asString(receiverRaw),
    };
  }
}
