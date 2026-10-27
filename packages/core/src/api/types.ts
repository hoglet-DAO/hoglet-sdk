export interface ApiPagination {
  page: number;
  limit: number;
  totalItems: number;
}

export interface Paginated<T> {
  data: T[];
  pagination?: ApiPagination;
}

export interface ApiToken {
  id: string;
  network: string;
  name: string;
  symbol: string;
  decimals: number;
  iconUri: string | null;
  projectUri: string | null;
  originalCoinType: string | null;
  metadataStandard: string | null;
  verified: boolean;
  displayOrder: number;
  priceUsdCurrent: string | null;
  priceAnchor: string | null;
}

export interface ApiPairToken {
  id: string;
  network: string;
  name: string;
  symbol: string;
  decimals: number;
  iconUri: string | null;
  verified: boolean;
  originalCoinType: string | null;
  metadataStandard: string | null;
}

export interface ApiAmmPair {
  id: string;
  pair: string;
  network: string;
  verified: boolean;
  creator: string;
  displayOrder: number;
  reserve0: string;
  reserve1: string;
  tvlUsd: string;
  volumeUsd24h: string;
  volumeUsd7d: string;
  feesUsd24h: string;
  apr24h: string | null;
  apr7d: string | null;
  apyCalculated: string;
  lpFeePercent: string;
  token0: ApiPairToken | null;
  token1: ApiPairToken | null;
}

export interface ApiStakingPool {
  id: string;
  network: string;
  creatorAddress: string;
  isDynamicPool: boolean;
  boostEnabled: boolean;
  boostConfigCollectionOwner: string | null;
  boostConfigCollectionName: string | null;
  boostConfigPercent: string | null;
  poolType: string;
  verified: boolean;
  displayOrder: number;
  startTimestamp: string | null;
  endTimestamp: string | null;
  stakeTokenAddress: string | null;
  rewardTokenAddress: string | null;
  rewardPerSec: string | null;
  accumReward: string | null;
  totalStakedAmount: string | null;
  totalBoosted: string | null;
  cachedApy: string | null;
  cachedTvlUsd: string | null;
  cachedStakerCount: number | null;
  stakeToken: { symbol?: string } | null;
  rewardToken: { symbol?: string } | null;
}

export interface ApiAmmMetric {
  id: string;
  pair: string;
  tvlUsd: string;
  apy: string;
  volume24h: string;
}

export interface ApiStakingMetric {
  pool_id: string;
  pool_address: string;
  tvlUsd: string;
  apy: string;
  rewardPerSec: string;
  totalStaked: string;
}

export interface ApiAiMetrics {
  amm: ApiAmmMetric[];
  staking: ApiStakingMetric[];
}

export interface ApiLaunchProject {
  id: number;
  dev: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  tokenDecimals: number;
  uri: string;
  network: string;
  createdAt: string | null;
  description: string;
  stream?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  website?: string | null;
  github?: string | null;
  unstakePeriodSeconds?: number | null;
  project_type: string | null;
  isFallback?: boolean;
  networkMismatch?: boolean;
}

export interface ApiTokenHolder {
  balance: string;
  userWalletAddress: string;
}

export interface ApiOhlcBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiPageParams {
  page?: number;
  limit?: number;
}

export interface ApiTokenQuery extends ApiPageParams {
  search?: string;
  verified?: boolean;
}

export interface ApiAmmPairQuery extends ApiPageParams {
  search?: string;
  verified?: boolean;
  token0?: string;
  token1?: string;
  sortBy?: "default" | "apr" | "tvl" | "volume";
  sortOrder?: "asc" | "desc";
}

export interface ApiStakingPoolQuery extends ApiPageParams {
  search?: string;
  verified?: boolean;
  poolType?: string;
  status?: "active" | "ended";
}

export interface ApiProjectQuery extends ApiPageParams {
  search?: string;
  projectType?: string;
}

export interface ApiDaoQuery extends ApiPageParams {
  search?: string;
  sort?: "tvl" | "name" | "created";
  order?: "asc" | "desc";
  verified?: boolean;
  inflationary?: boolean;
}

export interface ApiDaoPage<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiProposal {
  id: string;
  daoAddress: string | null;
  proposalId: number;
  proposerAddress: string;
  metadataUri: string;
  executionHash: string;
  status: string;
  votesFor: string;
  votesAgainst: string;
  createdAt: string | null;
  startTime: string;
  endTime: string;
}

export interface ApiComment {
  id: string;
  proposalId: string;
  authorAddress: string;
  content: string;
  likes: number;
  parentCommentId: string | null;
  createdAt: string | null;
}

export interface ApiSwapPath {
  path: string[];
}

export interface ApiSwapPathQuery {
  tokenIn: string;
  tokenOut: string;
  /** Raw amount (base units) used for the liquidity/dust heuristic. */
  amount?: string | number;
  exactOut?: boolean;
  /** Overrides the config network (`supra-mainnet` | `supra-testnet`). */
  network?: string;
}

export interface ApiProtocolStats {
  id: number | string;
  network: string;
  timestamp: string;
  totalTvlUsd: number;
  ammTvlUsd: number;
  virtualPoolsTvlUsd: number;
  stakingTvlUsd: number;
  totalVolume24hUsd: number;
  ammVolume24hUsd: number;
  totalUniqueUsers: number | null;
  totalFeesEarnedUsd24h: number;
}

export interface ApiProtocolStatsQuery {
  latest?: boolean;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  network?: string;
}
