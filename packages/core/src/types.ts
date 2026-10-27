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

export interface AmmReserves {
  tokenA: string;
  tokenB: string;
  reserveARaw: string;
  reserveBRaw: string;
}

export interface AmmPairInfo {
  tokenA: string;
  tokenB: string;
  pairAddress: string | null;
}

export interface FarmPoolInfo {
  creator: string;
  stakeToken: string;
  rewardToken: string;
  exists: boolean;
  finished: boolean;
  rewardPerSecRaw: string;
  startTimestamp: number;
  endTimestamp: number;
  totalStakedRaw: string;
  totalBoostedRaw: string;
}

export interface FarmPosition {
  creator: string;
  stakeToken: string;
  rewardToken: string;
  user: string;
  stakedRaw: string;
  pendingRewardsRaw: string;
  boostedRaw: string;
  isBoosted: boolean;
}

export interface MultisigAccountInfo {
  address: string;
  exists: boolean;
  owners: string[];
  threshold: number;
  timeoutSeconds: number;
  nextSequenceNumber: number;
  lastResolvedSequenceNumber: number;
  metadata: Record<string, string>;
}

export interface MultisigVote {
  owner: string;
  approved: boolean;
}

export interface MultisigTransactionInfo {
  sequenceNumber: number;
  creator: string;
  creationTimeSecs: number;
  payload: string | null;
  payloadHash: string | null;
  approvals: number;
  rejections: number;
  votes: MultisigVote[];
}

export interface MultisigConfig {
  admin: string;
  creationFeeRaw: string;
  treasury: string;
}

export interface LegacyMultisigDetails {
  id: number;
  participants: string[];
  name: string;
  approvalThreshold: number;
  cancellationThreshold: number;
  address: string;
}

export interface LegacyProposalDetails {
  proposalId: number;
  creator: string;
  posted: boolean;
  approvalVotes: number;
  cancellationVotes: number;
  addParticipants: string[];
  removeParticipants: string[];
  withdrawTokens: unknown[];
  withdrawFAs: unknown[];
  withdrawCoins: unknown[];
  withdrawDigitalAssets: unknown[];
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
  assetAddress?: string | null;
  nativeAssetAddress?: string | null;
  creatorAddress?: string;
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string | null;
  createdAt?: string;
  totalValueLocked?: string;
  stakedTvl?: string;
  apr?: string | null;
  isPaused?: boolean;
  isInflationary?: boolean;
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

export interface CurveSellQuote {
  quoteOutRaw: string;
  metadata: TokenMetadata | null;
}

/** `hoglet_core::get_current_price` returns quote raw units scaled by 1e8. */
export interface CurvePrice {
  tokenAddress: string;
  priceRaw: string;
  price: string;
}

export interface UserStakeInfo {
  tokenAddress: string;
  user: string;
  unlockedRaw: string;
  stakedRaw: string;
}

export interface HodlPoolStats {
  tokenAddress: string;
  totalStakedRaw: string;
  totalSupplyRaw: string;
}

export type VaultSecurityStatus =
  | "unmanaged"
  | "permanently_renounced"
  | "dao_governed"
  | "hazard_key_still_active"
  | "unknown";

/**
 * Aggregated control report for an address managed by `dao_contracts_vault`.
 *
 * `isRenounced` only means a factory tombstone exists. Authoritative
 * immutability is `isCryptographicallyFrozen` / `isPermanentlyImmutable`.
 */
export interface ContractControl {
  contractAddress: string;
  isFactoryManaged: boolean;
  isRenounced: boolean;
  isCryptographicallyFrozen: boolean;
  isPermanentlyImmutable: boolean;
  isKeyAnnihilated: boolean;
  isEoa: boolean;
  admin: string | null;
  creator: string | null;
  eoaProxy: string | null;
  securityStatus: VaultSecurityStatus;
  note: string;
}

export interface ManagedContractItem {
  contractAddress: string;
  creator: string;
  admin: string;
  isResourceAccount: boolean;
  isRenounced: boolean;
}

