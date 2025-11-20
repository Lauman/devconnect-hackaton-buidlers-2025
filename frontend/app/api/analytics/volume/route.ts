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

    const volumeByAsset: Record<string, number> = {};

    result.entities.forEach(entity => {
      const payload = JSON.parse(new TextDecoder().decode(entity.payload));
      const asset = payload.reserve;
      const amount = parseFloat(payload.amount);

      if (!volumeByAsset[asset]) {
        volumeByAsset[asset] = 0;
      }
      volumeByAsset[asset] += amount;
    });

    return NextResponse.json({
      success: true,
      data: volumeByAsset,
    });
  } catch (error) {
    console.error('Volume API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate volume' },
      { status: 500 }
    );
  }
}

// Cache for 30 seconds
export const revalidate = 30;
