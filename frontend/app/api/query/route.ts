import { NextRequest, NextResponse } from 'next/server';
import { getArkivPublicClient } from '@/lib/arkiv';
import { eq } from '@arkiv-network/sdk/query';
import type { ParsedEvent } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, protocol, eventType, asset, user, minAmount, maxAmount, limit } = body;

    const client = getArkivPublicClient();

    // Build query based on filters
    let query = client.buildQuery();

    // Priority: entity type > protocol > specific filters
    if (entityType && entityType !== 'all') {
      query = query.where(eq('entityType', entityType));
    } else if (protocol && protocol !== 'all') {
      query = query.where(eq('protocol', protocol));
    } else if (eventType && eventType !== 'all') {
      query = query.where(eq('eventType', eventType));
    } else if (asset) {
      query = query.where(eq('reserve', asset));
    } else if (user) {
      query = query.where(eq('user', user));
    } else {
      query = query.where(eq('entityType', 'protocol_event'));
    }

    const result = await query
      .withAttributes(true)
      .withPayload(true)
      .fetch();

    // Parse and filter results
    let events: ParsedEvent[] = result.entities.map(entity => {
      const payload = JSON.parse(new TextDecoder().decode(entity.payload));
      return {
        ...payload,
        entityKey: entity.key,
      };
    });

    // Client-side filtering for protocol (if entityType was the main filter)
    if (entityType && protocol && protocol !== 'all') {
      events = events.filter(e => (e as any).protocol === protocol);
    }

    // Client-side filtering for event type
    if (eventType && eventType !== 'all' && (entityType || protocol)) {
      events = events.filter(e => e.eventType === eventType);
    }

    // Client-side filtering for asset
    if (asset && (eventType || protocol || entityType)) {
      events = events.filter(e => {
        // Handle both Aave (reserve) and Uniswap (tokenIn/tokenOut)
        return (e as any).reserve === asset ||
               (e as any).tokenIn === asset ||
               (e as any).tokenOut === asset;
      });
    }

    // Client-side filtering for user
    if (user && (eventType || protocol || entityType || asset)) {
      events = events.filter(e => {
        // Handle both Aave (user) and Uniswap (sender/recipient)
        return (e as any).user === user ||
               (e as any).sender === user ||
               (e as any).recipient === user;
      });
    }

    // Client-side filtering for amount ranges
    if (minAmount) {
      const min = parseFloat(minAmount);
      events = events.filter(e => {
        const amount = parseFloat((e as any).amountUSD || (e as any).amount || '0');
        return amount >= min;
      });
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      events = events.filter(e => {
        const amount = parseFloat((e as any).amountUSD || (e as any).amount || '0');
        return amount <= max;
      });
    }

    // Sort by timestamp descending
    events.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit
    const resultLimit = limit || 100;
    events = events.slice(0, resultLimit);

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
      query: {
        entityType,
        protocol,
        eventType,
        asset,
        user,
        minAmount,
        maxAmount,
        limit: resultLimit,
      },
    });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}
