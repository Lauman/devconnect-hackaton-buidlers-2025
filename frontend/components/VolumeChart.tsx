'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VolumeData {
  asset: string;
  volume: number;
}

export default function VolumeChart() {
  const [data, setData] = useState<VolumeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolumeData();
  }, []);

  async function fetchVolumeData() {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/volume');
      const json = await response.json();

      if (json.success) {
        // Transform data for recharts
        const chartData = Object.entries(json.data).map(([asset, volume]) => ({
          asset,
          volume: Math.round(volume as number),
        }));

        // Sort by volume descending
        chartData.sort((a, b) => b.volume - a.volume);
        setData(chartData);
      }
    } catch (error) {
      console.error('Failed to fetch volume data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Total Volume by Asset</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Total Volume by Asset</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Total transaction volume across all event types
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="asset" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="volume" fill="#3b82f6" name="Volume ($)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
