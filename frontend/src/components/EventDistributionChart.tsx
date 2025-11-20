'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface EventDistribution {
  name: string;
  value: number;
}

interface EventDistributionChartProps {
  data: EventDistribution[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function EventDistributionChart({ data }: EventDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Event Type Distribution</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">No data available</div>
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
            // @ts-expect-error - Recharts type compatibility issue
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
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
