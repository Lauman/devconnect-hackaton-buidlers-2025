import { NextResponse } from 'next/server';
import { calculateEventStats } from '@/lib/queries';

export async function GET() {
  try {
    const stats = await calculateEventStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}

// Cache for 30 seconds
export const revalidate = 30;
