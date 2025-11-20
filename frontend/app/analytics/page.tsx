'use client';

import { useEffect, useState } from 'react';
import VolumeChart from '@/components/VolumeChart';
import EventDistributionChart from '@/components/EventDistributionChart';
import StatsCards from '@/components/StatsCards';
import ProtocolComparisonChart from '@/components/ProtocolComparisonChart';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import HourlyVolumeChart from '@/components/HourlyVolumeChart';
import {
  queryAllEvents,
  queryAggregatedMetrics,
  queryPriceSnapshots,
} from '@/lib/queries';
import type { ParsedEvent, ParsedMetric, ParsedPrice } from '@/lib/types';

export default function AnalyticsPage() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [metrics, setMetrics] = useState<ParsedMetric[]>([]);
  const [prices, setPrices] = useState<ParsedPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [eventsData, metricsData, pricesData] = await Promise.all([
          queryAllEvents(500),
          queryAggregatedMetrics(100),
          queryPriceSnapshots(100),
        ]);

        setEvents(eventsData);
        setMetrics(metricsData);
        setPrices(pricesData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DeFi Protocol Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Dune-style analytics dashboard for Aave V3 & Uniswap V3, powered by Arkiv DB-chain
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Key Metrics */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Key Metrics</h2>
            <StatsCards />
          </div>

          {/* Protocol Comparison */}
          {events.length > 0 && (
            <div className="mb-8">
              <ProtocolComparisonChart events={events} />
            </div>
          )}

          {/* Charts Grid - Original Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <VolumeChart />
            <EventDistributionChart />
          </div>

          {/* Hourly Volume Trends */}
          {metrics.length > 0 && (
            <div className="mb-8">
              <HourlyVolumeChart metrics={metrics} />
            </div>
          )}

          {/* Price History */}
          {prices.length > 0 && (
            <div className="mb-8">
              <PriceHistoryChart prices={prices} />
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>💡</span>
              About This Dashboard
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              This is a Dune Analytics-style dashboard that queries DeFi protocol events directly from
              Arkiv&apos;s DB-chain. All data is queryable, verifiable, and stored on-chain.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">Data Source:</span> Arkiv DB-chain
              </div>
              <div>
                <span className="font-semibold">Protocols:</span> Aave V3, Uniswap V3
              </div>
              <div>
                <span className="font-semibold">Chain:</span> Ethereum
              </div>
              <div>
                <span className="font-semibold">Events:</span> {events.length}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
