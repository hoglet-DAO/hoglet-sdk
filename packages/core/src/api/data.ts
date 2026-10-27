import type { HogletConfig } from "../config.js";
import type {
  ApiAiMetrics,
  ApiAmmPair,
  ApiAmmPairQuery,
  ApiStakingPool,
  ApiStakingPoolQuery,
  ApiToken,
  ApiTokenQuery,
  Paginated,
} from "./types.js";
import { HttpClient, apiNetwork, query } from "./http.js";

/**
 * Hoglet public data API (D1 + Edge): indexed tokens, AMM pairs, staking
 * pools and AI-flattened metrics. All reads are optional; no on-chain state
 * depends on them.
 */
export class DataApi {
  private readonly http: HttpClient;

  constructor(private readonly config: HogletConfig) {
    this.http = new HttpClient(config.dataApiBase);
  }

  async getTokens(params: ApiTokenQuery = {}): Promise<ApiToken[]> {
    return this.list<ApiToken>("/tokens", {
      network: apiNetwork(this.config.network),
      search: params.search,
      verified: params.verified,
      page: params.page,
      limit: params.limit,
    });
  }

  async getAmmPairs(params: ApiAmmPairQuery = {}): Promise<ApiAmmPair[]> {
    return this.list<ApiAmmPair>("/ammpairs", {
      network: apiNetwork(this.config.network),
      search: params.search,
      verified: params.verified,
      token0: params.token0,
      token1: params.token1,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      page: params.page,
      limit: params.limit,
    });
  }

  async getStakingPools(
    params: ApiStakingPoolQuery = {},
  ): Promise<ApiStakingPool[]> {
    return this.list<ApiStakingPool>("/stakingpools", {
      network: apiNetwork(this.config.network),
      search: params.search,
      verified: params.verified,
      poolType: params.poolType,
      status: params.status,
      page: params.page,
      limit: params.limit,
    });
  }

  async getAiMetrics(): Promise<ApiAiMetrics> {
    return this.http.get<ApiAiMetrics>(
      `/ai-metrics${query({ network: apiNetwork(this.config.network) })}`,
    );
  }

  private async list<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<T[]> {
    const json = await this.http.get<Paginated<T>>(`${path}${query(params)}`);
    return Array.isArray(json.data) ? json.data : [];
  }
}
