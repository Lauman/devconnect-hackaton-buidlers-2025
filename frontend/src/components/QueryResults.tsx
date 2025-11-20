'use client';

import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatDistance } from 'date-fns';
import type { ParsedEvent } from '@/lib/types';
import type { QueryConfig } from './QueryBuilder';

interface QueryResultsProps {
  results: ParsedEvent[];
  config: QueryConfig;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function QueryResults({ results, config }: QueryResultsProps) {
  const chartData = useMemo(() => {
    if (config.chartType === 'bar' || config.chartType === 'pie') {
      // Group by event type
      const grouped: Record<string, number> = {};
      results.forEach(event => {
        grouped[event.eventType] = (grouped[event.eventType] || 0) + 1;
      });
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }

    if (config.chartType === 'line') {
      // Group by date
      const grouped: Record<string, number> = {};
      results.forEach(event => {
        const date = new Date(event.timestamp).toLocaleDateString();
        grouped[date] = (grouped[date] || 0) + 1;
      });
      return Object.entries(grouped)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, count]) => ({ date, count }));
    }

    return [];
  }, [results, config.chartType]);

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your query filters to see results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Query Results</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {results.length} event{results.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadCSV(results)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => copyToClipboard(results)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📋 Copy JSON
            </button>
          </div>
        </div>

        {/* Visualization */}
        {config.chartType === 'table' ? (
          <TableView results={results} />
        ) : config.chartType === 'bar' ? (
          <BarChartView data={chartData} />
        ) : config.chartType === 'pie' ? (
          <PieChartView data={chartData} />
        ) : config.chartType === 'line' ? (
          <LineChartView data={chartData} />
        ) : null}
      </div>
    </div>
  );
}

function TableView({ results }: { results: ParsedEvent[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asset</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tx</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {results.map((event, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                  {event.eventType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">{event.reserve}</td>
              <td className="px-6 py-4 whitespace-nowrap">{parseFloat(event.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{event.user.slice(0, 6)}...{event.user.slice(-4)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                <a href={`https://explorer.mendoza.hoodi.arkiv.network/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  {event.txHash.slice(0, 8)}...
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChartView({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Count" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Events" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    Supply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Borrow: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Withdraw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Repay: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    LiquidationCall: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

function downloadCSV(results: ParsedEvent[]) {
  const headers = ['Event Type', 'Asset', 'Amount', 'User', 'Timestamp', 'Tx Hash', 'Block'];
  const rows = results.map(event => [
    event.eventType,
    event.reserve,
    event.amount,
    event.user,
    event.timestamp,
    event.txHash,
    event.blockNumber,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `query-results-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(results: ParsedEvent[]) {
  const json = JSON.stringify(results, null, 2);
  navigator.clipboard.writeText(json);
  alert('Results copied to clipboard!');
}
