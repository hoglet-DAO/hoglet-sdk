export type DaoStatusKind =
  | "inflationary"
  | "static_blessed"
  | "static_under_curatorship"
  | "unknown";

export interface DaoStatus {
  daoAddress: string;
  isActive: boolean | null;
  isBlessed: boolean | null;
  isInflationary: boolean | null;
  status: DaoStatusKind;
  guardian: string | null;
  curator: string | null;
  note: string;
}

export type TradingPhase =
  | "curve"
  | "migrating"
  | "amm"
  | "governance-only"
  | "unknown";

export interface TradingPhaseInfo {
  phase: TradingPhase;
  tokenAddress: string;
  daoAddress: string | null;
  poolAddress: string | null;
  note?: string;
}

export interface TokenMetadata {
  address: string;
  queriedAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  iconUri: string | null;
}

export interface CurveProgress {
  poolAddress: string;
  quoteSymbol: string | null;
  quoteDecimals: number;
  raisedQuoteRaw: string;
  targetQuoteRaw: string;
  raisedQuote: string;
  targetQuote: string;
  percentComplete: number;
  completed: boolean;
  migrated: boolean;
}

export interface PoolState {
  tokenAddress: string;
  poolAddress: string | null;
  quoteMetadata: string | null;
  virtualTokenReserves: string;
  virtualQuoteReserves: string;
  isCompleted: boolean;
  isMigrated: boolean;
  targetThreshold: string;
  devAddress: string;
}

export interface AmmQuote {
  path: string[];
  amountInRaw: string;
  amountOutRaw: string;
  amountOut: string;
  inputSymbol: string | null;
  outputSymbol: string | null;
  inputDecimals: number;
  outputDecimals: number;
  priceImpactPct: number | null;
  warning?: string;
}

export interface EpochInfo {
  currentEpoch: number;
  nextEpochStartUnix: number;
  secondsUntilNextEpoch: number;
  hoursUntilNextEpoch: number;
  votingOpen: boolean;
}

export interface ApiDao {
  id?: string;
  daoAddress: string;
  tokenAddress?: string | null;
  creatorAddress?: string;
  name?: string;
  symbol?: string;
  description?: string;
  createdAt?: string;
  totalValueLocked?: string;
  isPaused?: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
}

export interface DaoInfo {
  daoAddress: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  status: DaoStatus;
  creatorAddress: string | null;
  totalValueLocked: string | null;
  isPaused: boolean | null;
}

export interface GaugeInfo {
  gaugeId: number;
  destination: string;
  stakingToken: string | null;
  poolAddress: string | null;
  symbol: string | null;
  totalVotes: string;
  isActive: boolean;
}

export interface ProposalDetails {
  proposer: string;
  startTime: string;
  endTime: string;
  eta: string;
  executed: boolean;
  canceled: boolean;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
}

export interface VeInfo {
  exists: boolean;
  lockedAmount: string;
  endEpoch: string;
  isDelegated: boolean;
}
