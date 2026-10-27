import { ReaderContext, asString, optionAddress } from "./context.js";
import type { ApiDaoQuery, ApiDaoPage } from "../api/types.js";
import type {
  ApiDao,
  DaoInfo,
  DaoStatus,
  DaoStatusKind,
} from "../types.js";

export class DaosReader extends ReaderContext {
  async getCurator(): Promise<string | null> {
    const raw = await this.safeViewOne(this.factory("petra", "get_curator"), []);
    return raw ? asString(raw) : null;
  }

  async getDaoStatus(daoAddress: string): Promise<DaoStatus> {
    // `charter::is_active` aborts when the address has no DaoConfig. Use it as
    // the existence probe so a plain token address is never misreported as a
    // static DAO under curatorship.
    let active: boolean | undefined;
    try {
      active = await this.viewOne<boolean>(this.factory("charter", "is_active"), [
        daoAddress,
      ]);
    } catch {
      const curator = await this.getCurator();
      return {
        daoAddress,
        isActive: null,
        isBlessed: null,
        isInflationary: null,
        status: "unknown",
        guardian: null,
        curator,
        note: "No DaoConfig found for this address (not a Hoglet DAO).",
      };
    }

    const [blessed, inflationary, guardianRaw, curator] = await Promise.all([
      this.safeViewOne<boolean>(this.factory("charter", "is_blessed"), [daoAddress]),
      this.safeViewOne<boolean>(this.factory("charter", "is_inflationary"), [
        daoAddress,
      ]),
      this.safeViewOne(this.factory("charter", "get_guardian"), [daoAddress]),
      this.getCurator(),
    ]);

    const guardian = optionAddress(guardianRaw);
    let status: DaoStatusKind = "unknown";
    let note = "No DaoConfig found for this address.";

    if (inflationary === true) {
      status = "inflationary";
      note = "Inflationary ve(3,3) DAO (gauges, emissions and bribes enabled).";
    } else if (inflationary === false && blessed === true) {
      status = "static_blessed";
      note = "Static DAO blessed by the curator. Full governance enabled.";
    } else if (inflationary === false && blessed === false) {
      status = "static_under_curatorship";
      note =
        "Static DAO under curatorship: treasury/NFT proposals work, but config, guardian and script changes require blessing (charter::bless_dao).";
    }

    return {
      daoAddress,
      isActive: typeof active === "boolean" ? active : null,
      isBlessed: typeof blessed === "boolean" ? blessed : null,
      isInflationary: typeof inflationary === "boolean" ? inflationary : null,
      status,
      guardian,
      curator,
      note,
    };
  }

  async listDaos(params: ApiDaoQuery = {}): Promise<ApiDao[]> {
    return this.api.daos.getDaos(params);
  }

  async listDaosPage(
    params: ApiDaoQuery = {},
  ): Promise<ApiDaoPage<ApiDao>> {
    return this.api.daos.getDaosPage(params);
  }

  async getDao(tokenAddress: string): Promise<DaoInfo | null> {
    const daoAddress = await this.getDaoForToken(tokenAddress);
    if (!daoAddress) return null;

    const [metadata, status, apiDaos] = await Promise.all([
      this.getTokenMetadata(tokenAddress),
      this.getDaoStatus(daoAddress),
      this.api.daos.getDaos(),
    ]);
    const apiDao = apiDaos.find(
      (d) => d.daoAddress?.toLowerCase() === daoAddress.toLowerCase(),
    );

    if (!metadata) return null;
    return {
      daoAddress,
      tokenAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      status,
      creatorAddress: apiDao?.creatorAddress ?? null,
      totalValueLocked: apiDao?.totalValueLocked ?? null,
      isPaused: apiDao?.isPaused ?? null,
    };
  }
}
