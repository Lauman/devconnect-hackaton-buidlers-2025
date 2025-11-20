import { getArkivPublicClient } from './arkiv';
import { eq } from '@arkiv-network/sdk/query';
import type { Entity } from '@arkiv-network/sdk';
import type {
  AaveRealEvent,
  ParsedAaveEvent,
  EventFilters,
  EventStats,
  WithdrawEvent,
  SupplyEvent,
  FlashLoanEvent,
  LiquidationCallEvent,
} from './types';

// ============================================================================
// ENTITY PARSING
// ============================================================================

/**
 * Parse Arkiv entity into typed event with metadata
 * Extracts event type from attributes and computes timestamp
 */
function parseAaveEntity(entity: Entity): ParsedAaveEvent {
  // Decode payload
  const text = new TextDecoder().decode(entity.payload);
  const data = JSON.parse(text) as AaveRealEvent;

  // Extract event type from attributes (backend uses "event-type" not "eventType")
  const eventTypeAttr = entity.attributes?.find((a: any) => a.key === "event-type");
  const eventType = eventTypeAttr?.value || "unknown";

  // Compute timestamp from block number (12s per block average for Ethereum)
  const timestamp = entity.createdAtBlock
    ? new Date(entity.createdAtBlock * 12000).toISOString()
    : new Date().toISOString();

  return {
    ...data,
    entityKey: entity.key,
    eventType,
    protocol: "aave-v3",
    timestamp,
  };
}

// ============================================================================
// PROTOCOL EVENT QUERIES
// ============================================================================

/**
 * Query all Aave V3 events
 * Uses "protocol" attribute which exists on all events
 */
export async function queryAllAaveEvents(limit = 100): Promise<ParsedAaveEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq("protocol", "aave-v3"))  // Backend uses this attribute
    .withPayload(true)
    .withAttributes(true)
    .fetch();

  return result.entities
    .map(parseAaveEntity)
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
    .slice(0, limit);
}

/**
 * Query events by type
 * Uses "event-type" attribute with kebab-case values
 */
export async function queryEventsByType(
  eventType: "withdraw" | "supply" | "flash-loan" | "liquidation-call",
  limit = 100
): Promise<ParsedAaveEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq("event-type", eventType))  // Backend uses "event-type" not "eventType"
    .withPayload(true)
    .withAttributes(true)
    .fetch();

  return result.entities
    .map(parseAaveEntity)
    .slice(0, limit);
}

/**
 * Query withdraw events specifically
 */
export async function queryWithdrawEvents(limit = 100): Promise<ParsedAaveEvent<WithdrawEvent>[]> {
  return queryEventsByType("withdraw", limit) as Promise<ParsedAaveEvent<WithdrawEvent>[]>;
}

/**
 * Query supply events specifically
 */
export async function querySupplyEvents(limit = 100): Promise<ParsedAaveEvent<SupplyEvent>[]> {
  return queryEventsByType("supply", limit) as Promise<ParsedAaveEvent<SupplyEvent>[]>;
}

/**
 * Query flash loan events specifically
 */
export async function queryFlashLoanEvents(limit = 100): Promise<ParsedAaveEvent<FlashLoanEvent>[]> {
  return queryEventsByType("flash-loan", limit) as Promise<ParsedAaveEvent<FlashLoanEvent>[]>;
}

/**
 * Query liquidation events specifically
 */
export async function queryLiquidationEvents(limit = 100): Promise<ParsedAaveEvent<LiquidationCallEvent>[]> {
  return queryEventsByType("liquidation-call", limit) as Promise<ParsedAaveEvent<LiquidationCallEvent>[]>;
}

/**
 * Query events by user address
 * Must use client-side filtering since we can only use one .where() clause
 */
export async function queryEventsByUser(userAddress: string, limit = 100): Promise<ParsedAaveEvent[]> {
  // Query all Aave events first
  const allEvents = await queryAllAaveEvents(1000);

  // Filter client-side for user
  return allEvents.filter(event => {
    if ("user" in event && event.user.toLowerCase() === userAddress.toLowerCase()) {
      return true;
    }
    if ("initiator" in event && event.initiator.toLowerCase() === userAddress.toLowerCase()) {
      return true;
    }
    return false;
  }).slice(0, limit);
}

/**
 * Query events by asset/reserve address
 * Client-side filtering since Arkiv only supports one .where() clause
 */
export async function queryEventsByAsset(assetAddress: string, limit = 100): Promise<ParsedAaveEvent[]> {
  const allEvents = await queryAllAaveEvents(1000);

  return allEvents.filter(event => {
    const eventAsset = ("reserve" in event && event.reserve) ||
                       ("asset" in event && event.asset) ||
                       ("collateralAsset" in event && event.collateralAsset);

    return eventAsset?.toLowerCase() === assetAddress.toLowerCase();
  }).slice(0, limit);
}

/**
 * Query with complex filters
 * Uses priority-based querying + client-side filtering
 */
export async function queryEventsWithFilters(filters: EventFilters): Promise<ParsedAaveEvent[]> {
  let events: ParsedAaveEvent[];

  // Priority 1: Query by event type if specified (most selective)
  if (filters.eventType && filters.eventType !== "all") {
    events = await queryEventsByType(filters.eventType, 1000);
  }
  // Priority 2: Query by protocol (fallback)
  else {
    events = await queryAllAaveEvents(1000);
  }

  // Apply client-side filters
  if (filters.user) {
    events = events.filter(event => {
      const eventUser = ("user" in event && event.user) ||
                       ("initiator" in event && event.initiator);
      return eventUser?.toLowerCase() === filters.user!.toLowerCase();
    });
  }

  if (filters.asset) {
    events = events.filter(event => {
      const eventAsset = ("reserve" in event && event.reserve) ||
                        ("asset" in event && event.asset);
      return eventAsset?.toLowerCase() === filters.asset!.toLowerCase();
    });
  }

  if (filters.minAmount) {
    events = events.filter(event => {
      const amount = parseFloat(event.amount || "0");
      return amount >= parseFloat(filters.minAmount!);
    });
  }

  if (filters.maxAmount) {
    events = events.filter(event => {
      const amount = parseFloat(event.amount || "0");
      return amount <= parseFloat(filters.maxAmount!);
    });
  }

  // Client-side filtering for date ranges
  if (filters.startDate) {
    const startTime = new Date(filters.startDate).getTime();
    events = events.filter(e => e.timestamp && new Date(e.timestamp).getTime() >= startTime);
  }

  if (filters.endDate) {
    const endTime = new Date(filters.endDate).getTime();
    events = events.filter(e => e.timestamp && new Date(e.timestamp).getTime() <= endTime);
  }

  // Apply limit
  const limit = filters.limit || 100;
  return events.slice(0, limit);
}

/**
 * Calculate statistics from events
 */
export async function calculateEventStats(): Promise<EventStats> {
  const events = await queryAllAaveEvents(1000);

  const stats: EventStats = {
    totalEvents: events.length,
    eventsByType: {},
    totalVolumeWei: {},
    uniqueUsers: 0,
    recentEvents: events.slice(0, 10),
  };

  const uniqueUserSet = new Set<string>();

  events.forEach(event => {
    // Count by event type
    stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;

    // Track unique users
    if ("user" in event) uniqueUserSet.add(event.user.toLowerCase());
    if ("initiator" in event) uniqueUserSet.add(event.initiator.toLowerCase());
    if ("liquidator" in event) uniqueUserSet.add(event.liquidator.toLowerCase());

    // Calculate volumes by asset (in wei)
    const asset = ("reserve" in event && event.reserve) ||
                 ("asset" in event && event.asset) ||
                 ("collateralAsset" in event && event.collateralAsset);

    const amount = event.amount ||
                  ("liquidatedCollateralAmount" in event && event.liquidatedCollateralAmount) ||
                  "0";

    if (asset) {
      const currentVolume = BigInt(stats.totalVolumeWei[asset] || "0");
      const eventAmount = BigInt(amount);
      stats.totalVolumeWei[asset] = (currentVolume + eventAmount).toString();
    }
  });

  stats.uniqueUsers = uniqueUserSet.size;
  return stats;
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================
// These are kept for backward compatibility during migration

export const queryAllEvents = queryAllAaveEvents;
export const queryAaveEvents = queryAllAaveEvents;
