import type { HogletConfig } from "./config.js";

export interface RpcOptions {
  timeoutMs?: number;
  retries?: number;
}

function short(text: string, max = 300): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export class RpcClient {
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(
    private readonly config: HogletConfig,
    options: RpcOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.retries = options.retries ?? 1;
  }

  /** Calls a Supra `view` function and returns its raw result tuple. */
  async view<T = unknown>(
    functionId: string,
    args: unknown[] = [],
    typeArguments: string[] = [],
  ): Promise<T[]> {
    const json = await this.request(`${this.config.rpcV1}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: functionId,
        type_arguments: typeArguments,
        arguments: args,
      }),
    });
    const result = (json as { result?: T[] }).result;
    return Array.isArray(result) ? result : [];
  }

  /** Reads a resource; returns null when the account/resource does not exist. */
  async getResource<T = unknown>(
    address: string,
    resourceType: string,
  ): Promise<T | null> {
    try {
      const json = await this.request(
        `${this.config.rpcV3}/accounts/${address}/resources/${resourceType}`,
        { method: "GET" },
      );
      return ((json as { data?: T }).data ?? null) as T | null;
    } catch {
      return null;
    }
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${short(text)}`);
        }
        return text ? JSON.parse(text) : {};
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(`Request failed: ${String(lastError)}`);
  }
}
