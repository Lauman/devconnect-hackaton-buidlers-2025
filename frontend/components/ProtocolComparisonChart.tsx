'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ParsedEvent } from '@/lib/types';

interface ProtocolComparisonData {
  protocol: string;
  totalVolumeUSD: number;
  transactionCount: number;
  avgTransactionSize: number;
}

interface ProtocolComparisonChartProps {
  events: ParsedEvent[];
}

export default function ProtocolComparisonChart({ events }: ProtocolComparisonChartProps) {
  const [data, setData] = useState<ProtocolComparisonData[]>([]);

  useEffect(() => {
    // Group events by protocol
    const protocolStats = events.reduce((acc, event) => {
      const protocol = (event as any).protocol;
      if (!protocol) return acc;

      if (!acc[protocol]) {
        acc[protocol] = {
          totalVolumeUSD: 0,
          transactionCount: 0,
        };
      }

      // Get USD amount
      const amountUSD = parseFloat((event as any).amountUSD || (event as any).amountInUSD || (event as any).amount || '0');

      acc[protocol].totalVolumeUSD += amountUSD;
      acc[protocol].transactionCount += 1;

      return acc;
    }, {} as Record<string, { totalVolumeUSD: number; transactionCount: number }>);

    // Convert to chart data
    const chartData = Object.entries(protocolStats).map(([protocol, stats]) => ({
      protocol: protocol === 'aave-v3' ? 'Aave V3' : protocol === 'uniswap-v3' ? 'Uniswap V3' : protocol,
      totalVolumeUSD: Math.round(stats.totalVolumeUSD),
      transactionCount: stats.transactionCount,
      avgTransactionSize: Math.round(stats.totalVolumeUSD / stats.transactionCount),
    }));

    setData(chartData);
  }, [events]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Protocol Comparison</h3>
        <p className="text-gray-600 dark:text-gray-400">No protocol data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Protocol Comparison</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map((protocol) => (
          <div key={protocol.protocol} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{protocol.protocol}</h4>
            <p className="text-2xl font-bold">${protocol.totalVolumeUSD.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {protocol.transactionCount} transactions
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Avg: ${protocol.avgTransactionSize.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="protocol" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
          />
          <Legend />
          <Bar dataKey="totalVolumeUSD" fill="#3B82F6" name="Total Volume (USD)" />
          <Bar dataKey="transactionCount" fill="#10B981" name="Transaction Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
