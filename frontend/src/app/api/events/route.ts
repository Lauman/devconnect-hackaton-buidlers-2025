import { NextRequest, NextResponse } from 'next/server';
import { queryEventsWithFilters } from '@/lib/queries';
import type { EventFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: EventFilters = {
      eventType: searchParams.get('eventType') as any,
      asset: searchParams.get('asset') || undefined,
      user: searchParams.get('user') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
    };

    const events = await queryEventsWithFilters(filters);

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
