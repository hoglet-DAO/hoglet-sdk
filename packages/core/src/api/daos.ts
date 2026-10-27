import type { ApiDao } from "../types.js";
import type {
  ApiComment,
  ApiDaoPage,
  ApiDaoQuery,
  ApiProposal,
} from "./types.js";
import { HttpClient, query } from "./http.js";

/**
 * Client for the DAO APIs.
 *
 * - Listing uses `indexApiBase` (`daos.hoglet.xyz` on mainnet), which supports
 *   search/sort/pagination and richer metadata.
 * - Proposals/comments use the worker (`apiBase`), where those routes live.
 * - If the index app is unavailable, listing falls back to the worker.
 */
export class DaosApi {
  constructor(
    private readonly http: HttpClient,
    private readonly indexHttp: HttpClient = http,
  ) {}

  async getDaos(params: ApiDaoQuery = {}): Promise<ApiDao[]> {
    try {
      return (await this.getDaosPage(params)).data;
    } catch {
      return [];
    }
  }

  async getDaosPage(params: ApiDaoQuery = {}): Promise<ApiDaoPage<ApiDao>> {
    let json: {
      data?: ApiDao[];
      total?: number;
      page?: number;
      totalPages?: number;
    };
    try {
      json = await this.indexHttp.get(this.daoListPath(params));
    } catch {
      json = await this.http.get(this.daoListPath(params));
    }
    const all = Array.isArray(json.data) ? json.data : [];
    const page = params.page ?? 1;
    const limit = params.limit;
    const serverPaginated = typeof json.total === "number";

    // Older worker builds ignore pagination and return every row. Normalize
    // locally so callers always get a real page.
    if (!serverPaginated && limit && all.length > limit) {
      const offset = (page - 1) * limit;
      return {
        data: all.slice(offset, offset + limit),
        total: all.length,
        page,
        totalPages: Math.ceil(all.length / limit),
      };
    }

    return {
      data: all,
      total: serverPaginated ? (json.total as number) : all.length,
      page: typeof json.page === "number" ? json.page : page,
      totalPages:
        typeof json.totalPages === "number"
          ? json.totalPages
          : Math.ceil(all.length / (limit ?? Math.max(all.length, 1))),
    };
  }

  private daoListPath(params: ApiDaoQuery): string {
    return `/api/daos${query({
      search: params.search,
      sort: params.sort,
      order: params.order,
      verified: params.verified,
      inflationary: params.inflationary,
      page: params.page,
      limit: params.limit,
    })}`;
  }

  /** Indexed proposal history for a DAO (not available on-chain cheaply). */
  async getProposals(daoAddress: string): Promise<ApiProposal[]> {
    const json = await this.http.get<{ data?: ApiProposal[] } | ApiProposal[]>(
      `/api/proposals/${encodeURIComponent(daoAddress)}`,
    );
    if (Array.isArray(json)) return json;
    return Array.isArray(json.data) ? json.data : [];
  }

  /** Off-chain comments for a proposal. */
  async getComments(proposalId: string): Promise<ApiComment[]> {
    const json = await this.http.get<{ data?: ApiComment[] } | ApiComment[]>(
      `/api/comments/${encodeURIComponent(proposalId)}`,
    );
    if (Array.isArray(json)) return json;
    return Array.isArray(json.data) ? json.data : [];
  }

  /** Escape hatch for other DAO endpoints without adding a typed method. */
  async get<T>(path: string): Promise<T> {
    return this.http.get<T>(path);
  }
}
