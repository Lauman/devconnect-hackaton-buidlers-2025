'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface EventDistribution {
  eventType: string;
  count: number;
  percentage: string;
}

const COLORS = {
  Supply: '#10b981',      // green
  Borrow: '#3b82f6',      // blue
  Withdraw: '#f59e0b',    // yellow
  Repay: '#8b5cf6',       // purple
  LiquidationCall: '#ef4444', // red
};

export default function EventDistributionChart() {
  const [data, setData] = useState<EventDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistributionData();
  }, []);

  async function fetchDistributionData() {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/distribution');
      const json = await response.json();

      if (json.success) {
        const chartData = Object.entries(json.data).map(([eventType, count]) => ({
          eventType,
          count: count as number,
          percentage: json.percentages[eventType],
        }));

        setData(chartData);
      }
    } catch (error) {
      console.error('Failed to fetch distribution data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Event Type Distribution</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Event Type Distribution</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Breakdown of events by type
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="eventType"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ eventType, percentage }) => `${eventType} (${percentage})`}
          >
            {data.map((entry) => (
              <Cell
                key={entry.eventType}
                fill={COLORS[entry.eventType as keyof typeof COLORS] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value} events`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
