import type { HogletConfig } from "../config.js";
import type {
  ApiProtocolStats,
  ApiProtocolStatsQuery,
  ApiSwapPath,
  ApiSwapPathQuery,
} from "./types.js";
import { HttpClient, apiNetwork, query } from "./http.js";

/**
 * Swap app API (swap.hoglet.xyz).
 *
 * `getSwapPath` is the useful part: it builds the pool graph and returns the
 * best route (possibly multi-hop). The other swap routes are thin proxies to
 * `api.hoglet.xyz`, already covered by `DataApi`.
 */
export class SwapApi {
  private readonly http: HttpClient;

  constructor(private readonly config: HogletConfig) {
    this.http = new HttpClient(config.swapApiBase);
  }

  async getSwapPath(params: ApiSwapPathQuery): Promise<string[]> {
    const json = await this.http.get<ApiSwapPath>(
      `/api/swap/path${query({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amount: params.amount,
        isExactOut: params.exactOut,
        network: params.network ?? apiNetwork(this.config.network),
      })}`,
    );
    return Array.isArray(json.path) ? json.path : [];
  }

  async getProtocolStats(
    params: ApiProtocolStatsQuery = {},
  ): Promise<ApiProtocolStats | null> {
    const json = await this.http.get<
      ApiProtocolStats | ApiProtocolStats[] | { data?: ApiProtocolStats }
    >(
      `/api/protocol-stats${query({
        network: params.network ?? apiNetwork(this.config.network),
        latest: params.latest,
        limit: params.limit,
        orderBy: params.orderBy,
        orderDirection: params.orderDirection,
      })}`,
    );
    const raw: unknown = json;
    let entry: ApiProtocolStats | undefined;
    if (Array.isArray(raw)) {
      entry = raw[0] as ApiProtocolStats | undefined;
    } else if (raw && typeof raw === "object" && "data" in raw) {
      entry = (raw as { data?: ApiProtocolStats }).data;
    } else {
      entry = raw as ApiProtocolStats;
    }
    return entry ?? null;
  }

  async getProtocolStatsHistory(
    params: ApiProtocolStatsQuery = {},
  ): Promise<ApiProtocolStats[]> {
    const orderDirection = params.orderDirection ?? "desc";
    const json = await this.http.get<
      ApiProtocolStats[] | { data?: ApiProtocolStats[] }
    >(
      `/api/protocol-stats${query({
        network: params.network ?? apiNetwork(this.config.network),
        limit: params.limit,
        orderBy: params.orderBy,
        orderDirection,
      })}`,
    );
    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json.data)
        ? json.data
        : [];
    // The API returns newest-first when ordering desc; expose chronological.
    return orderDirection === "desc" ? [...rows].reverse() : rows;
  }
}
