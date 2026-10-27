export type QueryValue = string | number | boolean | undefined | null;

export type QueryParams = Record<string, QueryValue>;

/** Serializes defined, non-empty query params. */
export function query(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Hoglet data APIs use `supra-<network>` as the network filter value. */
export function apiNetwork(network: "testnet" | "mainnet"): string {
  return `supra-${network}`;
}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 12_000,
  ) {}

  get base(): string {
    return this.baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
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
