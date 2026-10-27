import { toBytesHex } from "@hoglet/core";
import { TxBuilderBase } from "./base.js";
import { u64, u8, type Bytes, type TxPayload } from "../payload.js";

export interface SubmitScriptParams {
  /** 32-byte execution hash (raw hex or bytes). */
  executionHash: Bytes;
  /** IPFS CID of the source. */
  sourceCid: string;
  category: number;
  hasArgs: boolean;
}

function bytesArg(value: Bytes): string {
  if (value instanceof Uint8Array) return toBytesHex(value);
  const text = value.trim();
  if (/^0x[0-9a-fA-F]*$/.test(text)) return text.toLowerCase();
  return toBytesHex(text);
}

/** `dao_scripts::library` and per-DAO allow-list (`vault`). */
export class ScriptsTx extends TxBuilderBase {
  private library(fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.daoScripts}::library::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  private scriptVault(fn: string, args: unknown[]): TxPayload {
    return {
      function: `${this.config.contracts.daoScripts}::vault::${fn}`,
      typeArguments: [],
      functionArguments: args,
    };
  }

  /** Permissionless; pays the anti-spam fee configured on-chain. */
  submitScript(params: SubmitScriptParams): TxPayload {
    const hash = bytesArg(params.executionHash);
    if (hash.length !== 66) {
      throw new Error("executionHash must be 32 bytes (0x + 64 hex chars)");
    }
    return this.library("submit_script", [
      hash,
      params.sourceCid,
      u8(params.category),
      params.hasArgs,
    ]);
  }

  /** Allow-list a script for a DAO (submit as a DAO-signed payload). */
  approveScript(scriptId: string | number | bigint): TxPayload {
    return this.scriptVault("add", [u64(scriptId)]);
  }

  removeScriptApproval(scriptId: string | number | bigint): TxPayload {
    return this.scriptVault("remove", [u64(scriptId)]);
  }
}
