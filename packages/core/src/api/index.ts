import type { HogletConfig } from "../config.js";
import { HttpClient } from "./http.js";
import { DaosApi } from "./daos.js";
import { DataApi } from "./data.js";
import { LauncherApi } from "./launch.js";
import { SwapApi } from "./swap.js";

export * from "./types.js";
export { apiNetwork, query } from "./http.js";
export { DaosApi } from "./daos.js";
export { DataApi } from "./data.js";
export { LauncherApi } from "./launch.js";
export { SwapApi } from "./swap.js";

/**
 * Facade over the three Hoglet HTTP surfaces:
 *
 * - `daos`    → DAO worker (`config.apiBase`)
 * - `data`    → public indexed data (`config.dataApiBase`)
 * - `launch`  → launcher routes (`config.launcherApiBase`)
 *
 * Every method is a convenience read. On-chain reads never depend on them.
 */
export class ApiClient {
  readonly daos: DaosApi;
  readonly data: DataApi;
  readonly launch: LauncherApi;
  readonly swap: SwapApi;

  constructor(config: HogletConfig) {
    this.daos = new DaosApi(
      new HttpClient(config.apiBase),
      new HttpClient(config.indexApiBase),
    );
    this.data = new DataApi(config);
    this.launch = new LauncherApi(config);
    this.swap = new SwapApi(config);
  }
}
