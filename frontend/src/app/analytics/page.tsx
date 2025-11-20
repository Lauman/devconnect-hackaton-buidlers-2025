'use client';

import { useEffect, useState } from 'react';
import StatsCards from '@/components/StatsCards';
import EventTable from '@/components/EventTable';
import EventDistributionChart from '@/components/EventDistributionChart';
import { queryAllAaveEvents, calculateEventStats } from '@/lib/queries';
import { enhanceEvent, formatEventType } from '@/lib/utils';
import type { ParsedAaveEvent, EventStats } from '@/lib/types';

export default function AnalyticsPage() {
  const [events, setEvents] = useState<ParsedAaveEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events from Arkiv
      const fetchedEvents = await queryAllAaveEvents(100);

      // Enhance with computed fields (USD values, token symbols)
      const enhanced = fetchedEvents.map(enhanceEvent);

      setEvents(enhanced);

      // Calculate stats
      const calculatedStats = await calculateEventStats();
      setStats(calculatedStats);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading real Aave V3 events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Aave V3 Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time Aave V3 events from Arkiv Network
        </p>
        {loading && (
          <p className="text-sm text-blue-500 mt-1">Refreshing...</p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-200 mb-2">
            No events found.
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Make sure the backend is running and generating events. Check the backend logs for any errors.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <StatsCards events={events} />

          {/* Event Distribution Chart */}
          {stats && stats.eventsByType && Object.keys(stats.eventsByType).length > 0 && (
            <div className="mb-6">
              <EventDistributionChart
                data={Object.entries(stats.eventsByType).map(([name, value]) => ({
                  name: formatEventType(name),
                  value
                }))}
              />
            </div>
          )}

          {/* Event Table */}
          <EventTable events={events.slice(0, 20)} />

          {/* Info Card */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>💡</span>
              About This Dashboard
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              This dashboard displays real Aave V3 events captured by the backend and stored on Arkiv&apos;s DB-chain.
              All data is queryable, verifiable, and stored on-chain.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">Data Source:</span> Arkiv Mendoza
              </div>
              <div>
                <span className="font-semibold">Protocol:</span> Aave V3
              </div>
              <div>
                <span className="font-semibold">Events:</span> {events.length}
              </div>
              <div>
                <span className="font-semibold">Refresh:</span> 30s
              </div>
            </div>
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded text-xs">
              <p className="font-semibold mb-1">Backend Event Types:</p>
              <p className="text-gray-600 dark:text-gray-400">
                Withdraw, Supply, FlashLoan, LiquidationCall
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
