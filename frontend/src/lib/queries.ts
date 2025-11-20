import { getArkivPublicClient } from './arkiv';
import { eq } from '@arkiv-network/sdk/query';
import type {
  EntityData,
  ParsedEntity,
  ParsedEvent,
  ParsedAaveEvent,
  ParsedUniswapEvent,
  ParsedMetric,
  ParsedPrice,
  EventFilters,
  EventStats,
  ProtocolType,
  EntityType,
  ArkivEntity,
} from './types';

// Parse entity payload
export function parseEntityPayload<T extends EntityData = EntityData>(payload: Uint8Array): T {
  const text = new TextDecoder().decode(payload);
  return JSON.parse(text);
}

// Parse entity to typed entity
export function parseEntity<T extends EntityData = EntityData>(entity: ArkivEntity): ParsedEntity<T> {
  const data = parseEntityPayload<T>(entity.payload);
  return {
    ...data,
    entityKey: entity.key,
  };
}

// ============================================================================
// PROTOCOL EVENT QUERIES
// ============================================================================

// Query all protocol events
export async function queryAllEvents(limit = 100): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('entityType', 'protocol_event'))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events by protocol
export async function queryEventsByProtocol(
  protocol: ProtocolType,
  limit = 100
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('protocol', protocol))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query Aave V3 events
export async function queryAaveEvents(limit = 100): Promise<ParsedAaveEvent[]> {
  return queryEventsByProtocol('aave-v3', limit) as Promise<ParsedAaveEvent[]>;
}

// Query Uniswap V3 events
export async function queryUniswapEvents(limit = 100): Promise<ParsedUniswapEvent[]> {
  return queryEventsByProtocol('uniswap-v3', limit) as Promise<ParsedUniswapEvent[]>;
}

// Query events by type
export async function queryEventsByType(
  eventType: string,
  limit = 50
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('eventType', eventType))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events by asset
export async function queryEventsByAsset(
  asset: string,
  limit = 50
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('reserve', asset))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events by user
export async function queryEventsByUser(
  userAddress: string,
  limit = 50
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('user', userAddress))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events with filters
export async function queryEventsWithFilters(
  filters: EventFilters
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  let query = client.buildQuery();

  // Priority: entity type > protocol > specific filters
  if (filters.entityType) {
    query = query.where(eq('entityType', filters.entityType));
  } else if (filters.protocol) {
    query = query.where(eq('protocol', filters.protocol));
  } else if (filters.eventType && filters.eventType !== 'all') {
    query = query.where(eq('eventType', filters.eventType));
  } else if (filters.asset) {
    query = query.where(eq('reserve', filters.asset));
  } else if (filters.user) {
    query = query.where(eq('user', filters.user));
  } else {
    // Default: get all protocol events
    query = query.where(eq('entityType', 'protocol_event'));
  }

  const result = await query
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  let events = result.entities.map(parseEntity);

  // Client-side filtering for protocol (if entityType was the main filter)
  if (filters.entityType && filters.protocol) {
    events = events.filter(e => (e as any).protocol === filters.protocol);
  }

  // Client-side filtering for specific event type
  if (filters.eventType && filters.eventType !== 'all' && (filters.entityType || filters.protocol)) {
    events = events.filter(e => e.eventType === filters.eventType);
  }

  // Client-side filtering for asset
  if (filters.asset && (filters.eventType || filters.protocol || filters.entityType)) {
    events = events.filter(e => {
      // Handle both Aave (reserve) and Uniswap (tokenIn/tokenOut)
      return (e as any).reserve === filters.asset ||
             (e as any).tokenIn === filters.asset ||
             (e as any).tokenOut === filters.asset;
    });
  }

  // Client-side filtering for user
  if (filters.user && (filters.eventType || filters.protocol || filters.entityType || filters.asset)) {
    events = events.filter(e => {
      // Handle both Aave (user) and Uniswap (sender/recipient)
      return (e as any).user === filters.user ||
             (e as any).sender === filters.user ||
             (e as any).recipient === filters.user;
    });
  }

  // Client-side filtering for amount ranges
  if (filters.minAmount) {
    const min = parseFloat(filters.minAmount);
    events = events.filter(e => {
      const amount = parseFloat((e as any).amountUSD || (e as any).amount || '0');
      return amount >= min;
    });
  }

  if (filters.maxAmount) {
    const max = parseFloat(filters.maxAmount);
    events = events.filter(e => {
      const amount = parseFloat((e as any).amountUSD || (e as any).amount || '0');
      return amount <= max;
    });
  }

  // Client-side filtering for date ranges
  if (filters.startDate) {
    const startTime = new Date(filters.startDate).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() >= startTime);
  }

  if (filters.endDate) {
    const endTime = new Date(filters.endDate).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() <= endTime);
  }

  // Sort by timestamp descending
  events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply limit
  const limit = filters.limit || 100;
  return events.slice(0, limit);
}

// Calculate statistics
export async function calculateEventStats(): Promise<EventStats> {
  const events = await queryAllEvents(1000); // Get more events for stats

  const stats: EventStats = {
    totalEvents: events.length,
    eventsByType: {},
    totalVolume: {},
    uniqueUsers: 0,
    recentEvents: events.slice(0, 10),
    protocolBreakdown: {},
  };

  // Collect unique users (handles both Aave user field and Uniswap sender/recipient)
  const uniqueUserSet = new Set<string>();

  events.forEach(event => {
    // Count by event type
    if (!stats.eventsByType[event.eventType]) {
      stats.eventsByType[event.eventType] = 0;
    }
    stats.eventsByType[event.eventType]++;

    // Count by protocol
    const protocol = (event as any).protocol;
    if (protocol) {
      if (!stats.protocolBreakdown![protocol]) {
        stats.protocolBreakdown![protocol] = 0;
      }
      stats.protocolBreakdown![protocol]++;
    }

    // Track unique users
    const user = (event as any).user || (event as any).sender;
    if (user) {
      uniqueUserSet.add(user);
    }
    const recipient = (event as any).recipient;
    if (recipient) {
      uniqueUserSet.add(recipient);
    }

    // Sum volume by asset
    // For Aave events, use reserve and amount
    // For Uniswap events, use tokenIn/tokenOut and amountInUSD/amountOutUSD
    const reserve = (event as any).reserve;
    const amount = parseFloat((event as any).amountUSD || (event as any).amount || '0');

    if (reserve && !isNaN(amount)) {
      if (!stats.totalVolume[reserve]) {
        stats.totalVolume[reserve] = 0;
      }
      stats.totalVolume[reserve] += amount;
    }

    // Handle Uniswap tokenIn
    const tokenIn = (event as any).tokenIn;
    const amountInUSD = parseFloat((event as any).amountInUSD || '0');
    if (tokenIn && !isNaN(amountInUSD)) {
      if (!stats.totalVolume[tokenIn]) {
        stats.totalVolume[tokenIn] = 0;
      }
      stats.totalVolume[tokenIn] += amountInUSD;
    }

    // Handle Uniswap tokenOut
    const tokenOut = (event as any).tokenOut;
    const amountOutUSD = parseFloat((event as any).amountOutUSD || '0');
    if (tokenOut && !isNaN(amountOutUSD)) {
      if (!stats.totalVolume[tokenOut]) {
        stats.totalVolume[tokenOut] = 0;
      }
      stats.totalVolume[tokenOut] += amountOutUSD;
    }
  });

  stats.uniqueUsers = uniqueUserSet.size;

  return stats;
}

// ============================================================================
// AGGREGATED METRICS QUERIES
// ============================================================================

// Query all aggregated metrics
export async function queryAggregatedMetrics(limit = 100): Promise<ParsedMetric[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('entityType', 'aggregated_metric'))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(entity => parseEntity<ParsedMetric['data']>(entity));
}

// Query metrics by protocol
export async function queryMetricsByProtocol(
  protocol: ProtocolType,
  limit = 100
): Promise<ParsedMetric[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('protocol', protocol))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  // Filter to only metrics (in case other entity types also have protocol attribute)
  const metrics = result.entities
    .map(entity => parseEntity(entity))
    .filter(entity => entity.entityType === 'aggregated_metric')
    .slice(0, limit);

  return metrics as ParsedMetric[];
}

// Query hourly metrics for a specific time window
export async function queryMetricsByTimeWindow(
  timeWindow: string,
  limit = 50
): Promise<ParsedMetric[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('timeWindow', timeWindow))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(entity => parseEntity<ParsedMetric['data']>(entity));
}

// ============================================================================
// PRICE SNAPSHOT QUERIES
// ============================================================================

// Query all price snapshots
export async function queryPriceSnapshots(limit = 100): Promise<ParsedPrice[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('entityType', 'price_snapshot'))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(entity => parseEntity<ParsedPrice['data']>(entity));
}

// Query price snapshots for a specific asset
export async function queryPricesByAsset(
  asset: string,
  limit = 100
): Promise<ParsedPrice[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('asset', asset))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(entity => parseEntity<ParsedPrice['data']>(entity));
}

// ============================================================================
// GENERIC ENTITY QUERIES
// ============================================================================

// Query entities by type
export async function queryEntitiesByType<T extends EntityData = EntityData>(
  entityType: EntityType,
  limit = 100
): Promise<ParsedEntity<T>[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('entityType', entityType))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(entity => parseEntity<T>(entity));
}
