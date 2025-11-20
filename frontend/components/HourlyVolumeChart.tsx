'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { ParsedMetric } from '@/lib/types';

interface VolumeDataPoint {
  timestamp: string;
  time: string;
  [protocol: string]: string | number;
}

interface HourlyVolumeChartProps {
  metrics: ParsedMetric[];
}

export default function HourlyVolumeChart({ metrics }: HourlyVolumeChartProps) {
  const [data, setData] = useState<VolumeDataPoint[]>([]);
  const [protocols, setProtocols] = useState<string[]>([]);
  const [totalStats, setTotalStats] = useState<{
    totalVolume: number;
    totalTransactions: number;
    avgVolumePerHour: number;
  }>({
    totalVolume: 0,
    totalTransactions: 0,
    avgVolumePerHour: 0,
  });

  useEffect(() => {
    if (metrics.length === 0) {
      setData([]);
      setProtocols([]);
      return;
    }

    // Group metrics by timestamp
    const metricsByTime = metrics.reduce((acc, metric) => {
      const timestamp = metric.timestamp;
      if (!acc[timestamp]) {
        acc[timestamp] = {
          timestamp,
          time: format(new Date(timestamp), 'MMM dd HH:mm'),
        };
      }
      const protocolKey = metric.protocol === 'aave-v3' ? 'Aave V3' :
                          metric.protocol === 'uniswap-v3' ? 'Uniswap V3' :
                          metric.protocol;
      acc[timestamp][protocolKey] = parseFloat(metric.totalVolumeUSD);
      return acc;
    }, {} as Record<string, VolumeDataPoint>);

    // Convert to array and sort by timestamp
    const chartData = Object.values(metricsByTime).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get unique protocols
    const uniqueProtocols = Array.from(new Set(metrics.map((m) =>
      m.protocol === 'aave-v3' ? 'Aave V3' :
      m.protocol === 'uniswap-v3' ? 'Uniswap V3' :
      m.protocol
    )));

    // Calculate total stats
    const totalVolume = metrics.reduce((sum, m) => sum + parseFloat(m.totalVolumeUSD), 0);
    const totalTransactions = metrics.reduce((sum, m) => sum + m.transactionCount, 0);
    const avgVolumePerHour = chartData.length > 0 ? totalVolume / chartData.length : 0;

    setData(chartData);
    setProtocols(uniqueProtocols);
    setTotalStats({
      totalVolume,
      totalTransactions,
      avgVolumePerHour,
    });
  }, [metrics]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Hourly Volume Trends</h3>
        <p className="text-gray-600 dark:text-gray-400">No hourly metrics available</p>
      </div>
    );
  }

  // Colors for different protocols
  const colors = {
    'Aave V3': '#3B82F6',
    'Uniswap V3': '#10B981',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Hourly Volume Trends</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Volume</h4>
          <p className="text-2xl font-bold">${Math.round(totalStats.totalVolume).toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Transactions</h4>
          <p className="text-2xl font-bold">{totalStats.totalTransactions.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Volume/Hour</h4>
          <p className="text-2xl font-bold">${Math.round(totalStats.avgVolumePerHour).toLocaleString()}</p>
        </div>
      </div>

      {/* Area Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" />
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
          {protocols.map((protocol) => (
            <Area
              key={protocol}
              type="monotone"
              dataKey={protocol}
              stackId="1"
              stroke={colors[protocol as keyof typeof colors] || '#8B5CF6'}
              fill={colors[protocol as keyof typeof colors] || '#8B5CF6'}
              fillOpacity={0.6}
              name={`${protocol} Volume`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
