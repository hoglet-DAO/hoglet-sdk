import { ReaderContext, asNumber, asString } from "./context.js";
import type { ProposalDetails, VeInfo } from "../types.js";

export class GovernanceReader extends ReaderContext {
  async getProposalDetails(
    daoAddress: string,
    proposalId: string | number,
  ): Promise<ProposalDetails> {
    const result = await this.rpc.view<unknown>(
      this.factory("ledger", "get_proposal_details"),
      [daoAddress, String(proposalId)],
    );
    return {
      proposer: asString(result[0]),
      startTime: asString(result[1]),
      endTime: asString(result[2]),
      eta: asString(result[3]),
      executed: result[4] === true,
      canceled: result[5] === true,
      forVotes: asString(result[6] ?? "0"),
      againstVotes: asString(result[7] ?? "0"),
      abstainVotes: asString(result[8] ?? "0"),
    };
  }

  async getProposalState(
    daoAddress: string,
    proposalId: string | number,
  ): Promise<number> {
    const raw = await this.viewOne(
      this.factory("ledger", "get_proposal_state"),
      [daoAddress, String(proposalId)],
    );
    return asNumber(raw ?? 0);
  }

  async getTotalLocked(daoAddress: string): Promise<string> {
    const raw = await this.safeViewOne(
      this.factory("legacy", "get_total_locked"),
      [daoAddress],
    );
    return asString(raw ?? "0");
  }

  async getVotingPowerAt(
    veTokenAddress: string,
    epoch: string | number,
  ): Promise<string> {
    const raw = await this.safeViewOne(
      this.factory("legacy", "get_voting_power_at"),
      [veTokenAddress, String(epoch)],
    );
    return asString(raw ?? "0");
  }

  async getVeInfo(
    veTokenAddress: string,
    daoAddress: string,
  ): Promise<VeInfo> {
    const result = await this.rpc.view<unknown>(
      this.factory("legacy", "ve_info"),
      [veTokenAddress, daoAddress],
    );
    return {
      exists: result[0] === true,
      lockedAmount: asString(result[1] ?? "0"),
      endEpoch: asString(result[2] ?? "0"),
      isDelegated: result[3] === true,
    };
  }

  async getCreationFee(): Promise<string> {
    const raw = await this.viewOne(this.factory("petra", "get_creation_fee"), []);
    return asString(raw ?? "0");
  }
}
