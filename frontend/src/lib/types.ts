// ============================================================================
// BACKEND REAL EVENT TYPES (Source of Truth)
// ============================================================================

export interface WithdrawEvent {
  reserve: string;
  user: string;
  to: string;
  amount: string;
  txHash: string;
}

export interface SupplyEvent {
  reserve: string;
  user: string;
  onBehalfOf: string;
  amount: string;
  referralCode: string;
  txHash: string;
}

export interface FlashLoanEvent {
  target: string;
  initiator: string;
  asset: string;
  amount: string;
  interestRateMode: string;
  premium: string;
  referralCode: string;
  txHash: string;
}

export interface LiquidationCallEvent {
  collateralAsset: string;
  debtAsset: string;
  user: string;
  debtToCover: string;
  liquidatedCollateralAmount: string;
  liquidator: string;
  receiveAToken: boolean;
  txHash: string;
}

export type AaveRealEvent =
  | WithdrawEvent
  | SupplyEvent
  | FlashLoanEvent
  | LiquidationCallEvent;

// ============================================================================
// PARSED EVENT (with all possible fields and computed properties)
// ============================================================================

export interface ParsedAaveEvent {
  entityKey: string;
  eventType: string;
  protocol: "aave-v3";
  timestamp?: string;
  amountUSD?: string;
  reserveSymbol?: string;

  // All possible fields from different event types
  reserve?: string;
  user?: string;
  to?: string;
  amount?: string;
  txHash?: string;
  onBehalfOf?: string;
  referralCode?: string;
  target?: string;
  initiator?: string;
  asset?: string;
  interestRateMode?: string;
  premium?: string;
  collateralAsset?: string;
  debtAsset?: string;
  debtToCover?: string;
  liquidatedCollateralAmount?: string;
  liquidator?: string;
  receiveAToken?: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isWithdrawEvent(event: any): event is WithdrawEvent {
  return "to" in event && "reserve" in event && !("onBehalfOf" in event);
}

export function isSupplyEvent(event: any): event is SupplyEvent {
  return "onBehalfOf" in event && "referralCode" in event;
}

export function isFlashLoanEvent(event: any): event is FlashLoanEvent {
  return "target" in event && "initiator" in event && "asset" in event;
}

export function isLiquidationCallEvent(event: any): event is LiquidationCallEvent {
  return "collateralAsset" in event && "debtAsset" in event;
}

// ============================================================================
// FILTER INTERFACE
// ============================================================================

export interface EventFilters {
  protocol?: "aave-v3" | "all";
  eventType?: "Withdraw" | "Supply" | "FlashLoan" | "LiquidationCall" | "all";
  asset?: string;
  user?: string;
  minAmount?: string;
  maxAmount?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// ARKIV SDK ENTITY TYPE
// ============================================================================

export interface ArkivEntity {
  key: string;
  payload: Uint8Array;
  attributes?: Array<{
    key: string;
    value: string;
  }>;
  contentType?: string;
  owner?: string;
  createdAtBlock?: number;
  lastModifiedAtBlock?: number;
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
  totalVolumeWei: Record<string, string>;
  uniqueUsers: number;
  recentEvents: ParsedAaveEvent[];
}

// ============================================================================
// LEGACY TYPES (backward compatibility)
// ============================================================================

export type EntityType = 'protocol_event' | 'aggregated_metric' | 'price_snapshot';
export type ProtocolType = 'aave-v3' | 'uniswap-v3';
export type ParsedEvent = ParsedAaveEvent;
export type ParsedEntity<T = any> = ParsedAaveEvent;
