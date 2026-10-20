import type { HogletConfig } from "./config.js";
import type { ApiDao } from "./types.js";

/**
 * Minimal client for the Hoglet DAO worker. The public API currently exposes
 * `GET /api/daos` (plus proposals/comments). Everything else is read on-chain
 * by `HogletReader`, so the SDK keeps working if the worker is unavailable.
 */
export class ApiClient {
  constructor(
    private readonly config: HogletConfig,
    private readonly timeoutMs = 12_000,
  ) {}

  async getDaos(): Promise<ApiDao[]> {
    try {
      const json = await this.get<unknown>("/api/daos");
      const data = Array.isArray(json)
        ? json
        : (json as { data?: unknown })?.data;
      return Array.isArray(data) ? (data as ApiDao[]) : [];
    } catch {
      return [];
    }
  }

  async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.config.apiBase}${path}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}: ${text.slice(0, 200)}`);
      }
      return (text ? JSON.parse(text) : {}) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
