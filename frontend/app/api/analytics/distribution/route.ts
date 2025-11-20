import { NextResponse } from 'next/server';
import { getArkivPublicClient } from '@/lib/arkiv';
import { eq } from '@arkiv-network/sdk/query';

export async function GET() {
  try {
    const client = getArkivPublicClient();

    const result = await client
      .buildQuery()
      .where(eq('protocol', 'aave-v3'))
      .withPayload(true)
      .fetch();

    const distribution: Record<string, number> = {};
    let total = 0;

    result.entities.forEach(entity => {
      const payload = JSON.parse(new TextDecoder().decode(entity.payload));
      const eventType = payload.eventType;

      if (!distribution[eventType]) {
        distribution[eventType] = 0;
      }
      distribution[eventType]++;
      total++;
    });

    // Calculate percentages
    const percentages: Record<string, string> = {};
    Object.keys(distribution).forEach(eventType => {
      const percentage = ((distribution[eventType] / total) * 100).toFixed(1);
      percentages[eventType] = `${percentage}%`;
    });

    return NextResponse.json({
      success: true,
      data: distribution,
      percentages,
      total,
    });
  } catch (error) {
    console.error('Distribution API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate distribution' },
      { status: 500 }
    );
  }
}

// Cache for 30 seconds
export const revalidate = 30;
