'use client';

import { useState } from 'react';
import QueryBuilder, { type QueryConfig } from '@/components/QueryBuilder';
import QueryResults from '@/components/QueryResults';
import type { ParsedEvent } from '@/lib/types';

export default function QueryPage() {
  const [results, setResults] = useState<ParsedEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryConfig, setQueryConfig] = useState<QueryConfig | null>(null);

  async function executeQuery(config: QueryConfig) {
    setLoading(true);
    setError(null);
    setQueryConfig(config);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: config.entityType,
          protocol: config.protocol,
          eventType: config.eventType,
          asset: config.asset,
          user: config.user,
          minAmount: config.minAmount,
          maxAmount: config.maxAmount,
          limit: config.limit,
        }),
      });

      const json = await response.json();

      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error || 'Failed to execute query');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Query execution error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Query Builder</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build custom queries to analyze DeFi protocol data (Aave V3, Uniswap V3) on Arkiv DB-chain
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold mb-1">How to use</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Select filters to narrow down your results</li>
              <li>• Choose a visualization type (Table, Bar, Pie, or Line chart)</li>
              <li>• Click "Execute Query" to run your query against the DB-chain</li>
              <li>• Export results as CSV or copy as JSON</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Builder - Left Side */}
        <div className="lg:col-span-1">
          <QueryBuilder onExecute={executeQuery} loading={loading} />
        </div>

        {/* Results - Right Side */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Executing query...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {results && !loading && queryConfig && (
            <QueryResults results={results} config={queryConfig} />
          )}

          {!results && !loading && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Ready to Query</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your query on the left and click "Execute Query" to see results
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Example Queries */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Example Queries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => executeQuery({ protocol: 'aave-v3', eventType: 'Supply', chartType: 'bar', limit: 50 })}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-semibold mb-1">Aave Supply Events</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">View all Aave V3 supply transactions</p>
          </button>
          <button
            onClick={() => executeQuery({ protocol: 'uniswap-v3', chartType: 'pie', limit: 100 })}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-semibold mb-1">Uniswap Swaps</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">See all Uniswap V3 swap events</p>
          </button>
          <button
            onClick={() => executeQuery({ entityType: 'protocol_event', minAmount: '50000', chartType: 'table', limit: 25 })}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-semibold mb-1">High-Value Transactions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">All transactions over $50,000</p>
          </button>
          <button
            onClick={() => executeQuery({ protocol: 'aave-v3', asset: 'USDC', chartType: 'pie', limit: 100 })}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-semibold mb-1">Aave USDC Activity</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">All Aave USDC events with distribution</p>
          </button>
          <button
            onClick={() => executeQuery({ entityType: 'aggregated_metric', chartType: 'line', limit: 50 })}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-semibold mb-1">Hourly Metrics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">View aggregated hourly metrics over time</p>
          </button>
          <button
            onClick={() => executeQuery({ entityType: 'price_snapshot', chartType: 'line', limit: 100 })}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-semibold mb-1">Token Prices</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track token price history</p>
          </button>
        </div>
      </div>
    </div>
  );
}
