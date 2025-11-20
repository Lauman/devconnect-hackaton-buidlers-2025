// ============================================================================
// ENTITY TYPES
// ============================================================================

export type EntityType = 'protocol_event' | 'aggregated_metric' | 'price_snapshot';
export type ProtocolType = 'aave-v3' | 'uniswap-v3';
export type AaveEventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall';
export type UniswapEventType = 'Swap';
export type EventType = AaveEventType | UniswapEventType;

// ============================================================================
// AAVE V3 EVENTS
// ============================================================================

export interface AaveEvent {
  entityType: 'protocol_event';
  eventType: AaveEventType;
  protocol: 'aave-v3';
  network: string;
  reserve: string;
  user: string;
  amount: string;
  amountUSD: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;

  // Event-specific fields (optional)
  onBehalfOf?: string;
  to?: string;
  referralCode?: number;
  interestRateMode?: number;
  borrowRate?: string;
  repayer?: string;
  useATokens?: boolean;
  collateralAsset?: string;
  debtAsset?: string;
  liquidator?: string;
  liquidatedCollateralAmount?: string;
  liquidatedCollateralAmountUSD?: string;
  debtToCover?: string;
  debtToCoverUSD?: string;
}

// ============================================================================
// UNISWAP V3 EVENTS
// ============================================================================

export interface UniswapEvent {
  entityType: 'protocol_event';
  eventType: 'Swap';
  protocol: 'uniswap-v3';
  network: string;
  sender: string;
  recipient: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountInUSD: string;
  amountOutUSD: string;
  sqrtPriceX96: string;
  liquidity: string;
  tick: number;
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

// ============================================================================
// AGGREGATED METRICS
// ============================================================================

export interface AggregatedMetric {
  entityType: 'aggregated_metric';
  metricType: 'hourly_summary';
  protocol: ProtocolType;
  timeWindow: string;
  timestamp: string;
  totalVolumeUSD: string;
  transactionCount: number;
  uniqueUsers: number;
  assetVolumes: Record<string, string>;
  eventTypeCounts: Record<string, number>;
  avgTransactionSizeUSD: string;
}

// ============================================================================
// PRICE SNAPSHOTS
// ============================================================================

export interface PriceSnapshot {
  entityType: 'price_snapshot';
  snapshotType: 'price_snapshot';
  asset: string;
  priceUSD: string;
  timestamp: string;
  change24h: string;
  volume24hUSD: string;
  marketCapUSD?: string;
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type ProtocolEvent = AaveEvent | UniswapEvent;
export type EntityData = ProtocolEvent | AggregatedMetric | PriceSnapshot;

// ============================================================================
// PARSED ENTITY
// ============================================================================

export interface ParsedEntity<T extends EntityData = EntityData> extends T {
  entityKey: string;
}

export type ParsedEvent = ParsedEntity<ProtocolEvent>;
export type ParsedAaveEvent = ParsedEntity<AaveEvent>;
export type ParsedUniswapEvent = ParsedEntity<UniswapEvent>;
export type ParsedMetric = ParsedEntity<AggregatedMetric>;
export type ParsedPrice = ParsedEntity<PriceSnapshot>;

// ============================================================================
// ARKIV ENTITY RESPONSE
// ============================================================================

export interface ArkivEntity {
  key: string;
  payload: Uint8Array;
  attributes: Array<{
    key: string;
    value: string;
  }>;
  contentType: string;
  expiration: number;
  owner: string;
  createdAtBlock: number;
  lastModifiedAtBlock: number;
}

// ============================================================================
// QUERY RESULT
// ============================================================================

export interface EventQueryResult {
  entities: ArkivEntity[];
  hasNextPage: () => boolean;
  next: () => Promise<EventQueryResult>;
}

// ============================================================================
// STATS
// ============================================================================

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  totalVolume: {
    [asset: string]: number;
  };
  uniqueUsers: number;
  recentEvents: ParsedEvent[];
  protocolBreakdown?: {
    [protocol: string]: number;
  };
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export interface EventFilters {
  entityType?: EntityType;
  protocol?: ProtocolType;
  eventType?: EventType | 'all';
  asset?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  minAmount?: string;
  maxAmount?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAaveEvent(entity: EntityData): entity is AaveEvent {
  return entity.entityType === 'protocol_event' &&
         (entity as any).protocol === 'aave-v3';
}

export function isUniswapEvent(entity: EntityData): entity is UniswapEvent {
  return entity.entityType === 'protocol_event' &&
         (entity as any).protocol === 'uniswap-v3';
}

export function isAggregatedMetric(entity: EntityData): entity is AggregatedMetric {
  return entity.entityType === 'aggregated_metric';
}

export function isPriceSnapshot(entity: EntityData): entity is PriceSnapshot {
  return entity.entityType === 'price_snapshot';
}
