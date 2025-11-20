'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { ParsedPrice } from '@/lib/types';

interface PriceDataPoint {
  timestamp: string;
  date: string;
  [asset: string]: string | number;
}

interface PriceHistoryChartProps {
  prices: ParsedPrice[];
}

export default function PriceHistoryChart({ prices }: PriceHistoryChartProps) {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [assets, setAssets] = useState<string[]>([]);

  useEffect(() => {
    if (prices.length === 0) {
      setData([]);
      setAssets([]);
      return;
    }

    // Group prices by timestamp
    const pricesByTimestamp = prices.reduce((acc, price) => {
      const timestamp = price.timestamp;
      if (!acc[timestamp]) {
        acc[timestamp] = {
          timestamp,
          date: format(new Date(timestamp), 'MMM dd HH:mm'),
        };
      }
      acc[timestamp][price.asset] = parseFloat(price.priceUSD);
      return acc;
    }, {} as Record<string, PriceDataPoint>);

    // Convert to array and sort by timestamp
    const chartData = Object.values(pricesByTimestamp).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get unique assets
    const uniqueAssets = Array.from(new Set(prices.map((p) => p.asset)));

    setData(chartData);
    setAssets(uniqueAssets);
  }, [prices]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Token Price History</h3>
        <p className="text-gray-600 dark:text-gray-400">No price data available</p>
      </div>
    );
  }

  // Colors for different assets
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Token Price History</h3>

      {/* Latest Prices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {assets.slice(0, 4).map((asset, index) => {
          const latestPrice = prices
            .filter((p) => p.asset === asset)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          if (!latestPrice) return null;

          const change = parseFloat(latestPrice.change24h || '0');
          const isPositive = change >= 0;

          return (
            <div key={asset} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{asset}</h4>
              <p className="text-xl font-bold">${parseFloat(latestPrice.priceUSD).toLocaleString()}</p>
              <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
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
          {assets.map((asset, index) => (
            <Line
              key={asset}
              type="monotone"
              dataKey={asset}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              name={`${asset} Price`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
