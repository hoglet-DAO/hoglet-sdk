import type { HogletConfig } from "../config.js";
import type {
  ApiLaunchProject,
  ApiOhlcBar,
  ApiProjectQuery,
  ApiTokenHolder,
} from "./types.js";
import { HttpClient, apiNetwork, query } from "./http.js";

/**
 * Launcher API (Next.js routes on launch.hoglet.xyz): indexed projects, top
 * holders and OHLC candles. These are convenience reads; the authoritative
 * state remains on-chain.
 */
export class LauncherApi {
  private readonly http: HttpClient;

  constructor(private readonly config: HogletConfig) {
    this.http = new HttpClient(config.launcherApiBase);
  }

  async getProjects(
    params: ApiProjectQuery = {},
  ): Promise<{ data: ApiLaunchProject[]; count: number }> {
    const json = await this.http.get<{
      data?: ApiLaunchProject[];
      count?: number;
    }>(
      `/db_projects${query({
        network: apiNetwork(this.config.network),
        search: params.search,
        project_type: params.projectType,
        page: params.page,
        limit: params.limit,
      })}`,
    );
    return {
      data: Array.isArray(json.data) ? json.data : [],
      count: typeof json.count === "number" ? json.count : 0,
    };
  }

  async getProject(tokenAddress: string): Promise<ApiLaunchProject | null> {
    const json = await this.http.get<ApiLaunchProject>(
      `/get_project/${encodeURIComponent(tokenAddress)}${query({
        network: apiNetwork(this.config.network),
      })}`,
    );
    return json && typeof json === "object" ? json : null;
  }

  async getHolders(
    tokenAddress: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<ApiTokenHolder[]> {
    const json = await this.http.get<
      | Array<{ balance: string | number; userWalletAddress: string }>
      | { value?: Array<{ balance: string | number; userWalletAddress: string }> }
    >(
      `/get_holders/${encodeURIComponent(tokenAddress)}${query({
        network: apiNetwork(this.config.network),
        page: params.page,
        limit: params.limit,
      })}`,
    );
    const rows = Array.isArray(json) ? json : json.value ?? [];
    return rows.map((holder) => ({
      balance: String(holder.balance),
      userWalletAddress: holder.userWalletAddress,
    }));
  }

  async getOhlc(
    tokenAddress: string,
    resolution: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" = "1h",
  ): Promise<ApiOhlcBar[]> {
    const json = await this.http.get<
      ApiOhlcBar[] | { value?: ApiOhlcBar[] }
    >(
      `/charts/ohlc${query({
        tokenAddress,
        network: this.config.network,
        res: resolution,
      })}`,
    );
    if (Array.isArray(json)) return json;
    return Array.isArray(json.value) ? json.value : [];
  }
}
