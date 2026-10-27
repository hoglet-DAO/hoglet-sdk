import { ReaderContext, asNumber, asString } from "./context.js";
import type { GaugeInfo } from "../types.js";

export class GaugesReader extends ReaderContext {
  async getGauges(daoAddress: string, epoch?: number): Promise<GaugeInfo[]> {
    const countRaw = await this.safeViewOne(
      this.factory("zeal", "get_gauge_count"),
      [daoAddress],
    );
    const count = asNumber(countRaw ?? 0);
    if (count <= 0) return [];

    const targetEpoch = epoch ?? this.getEpochInfo().currentEpoch;
    const ids = Array.from({ length: count }, (_, index) => index);

    const gauges = await Promise.all(
      ids.map(async (gaugeId): Promise<GaugeInfo | null> => {
        const [destinationRaw, activeRaw, votesRaw] = await Promise.all([
          this.safeViewOne(this.factory("zeal", "get_gauge_destination"), [
            daoAddress,
            String(gaugeId),
          ]),
          this.safeViewOne(this.factory("zeal", "is_gauge_active"), [
            daoAddress,
            String(gaugeId),
          ]),
          this.safeViewOne(this.factory("zeal", "get_gauge_total_votes"), [
            daoAddress,
            String(targetEpoch),
            String(gaugeId),
          ]),
        ]);

        const destination = asString(destinationRaw);
        if (!destination || destination.toLowerCase() === "0x0") return null;

        const stakingTokenRaw = await this.safeViewOne(
          this.factory("foundry", "staking_token"),
          [destination],
        );
        const stakingToken = stakingTokenRaw ? asString(stakingTokenRaw) : null;
        const metadata = stakingToken
          ? await this.getTokenMetadata(stakingToken).catch(() => null)
          : null;

        return {
          gaugeId,
          destination,
          stakingToken,
          poolAddress: stakingToken,
          symbol: metadata?.symbol ?? null,
          totalVotes: asString(votesRaw ?? "0"),
          isActive: activeRaw === true,
        };
      }),
    );

    return gauges.filter((gauge): gauge is GaugeInfo => gauge !== null);
  }

  async isGaugeActive(daoAddress: string, gaugeId: number): Promise<boolean> {
    const raw = await this.safeViewOne(
      this.factory("zeal", "is_gauge_active"),
      [daoAddress, String(gaugeId)],
    );
    return raw === true;
  }
}
