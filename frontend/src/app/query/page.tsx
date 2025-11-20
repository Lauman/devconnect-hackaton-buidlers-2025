'use client';

import { useState } from 'react';
import { queryAllAaveEvents, queryEventsByType, queryEventsByUser, queryEventsByAsset } from '@/lib/queries';
import { enhanceEvent, formatEventType, formatAddress, formatTimestamp } from '@/lib/utils';
import type { ParsedAaveEvent } from '@/lib/types';

type QueryType = 'all' | 'by-type' | 'by-user' | 'by-asset';

export default function QueryPage() {
  const [queryType, setQueryType] = useState<QueryType>('all');
  const [eventType, setEventType] = useState<'Withdraw' | 'Supply' | 'FlashLoan' | 'LiquidationCall'>('Withdraw');
  const [userAddress, setUserAddress] = useState('');
  const [assetAddress, setAssetAddress] = useState('');
  const [limit, setLimit] = useState(50);

  const [results, setResults] = useState<ParsedAaveEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    try {
      setLoading(true);
      setError(null);

      let events: ParsedAaveEvent[] = [];

      switch (queryType) {
        case 'all':
          events = await queryAllAaveEvents(limit);
          break;
        case 'by-type':
          events = await queryEventsByType(eventType, limit);
          break;
        case 'by-user':
          if (!userAddress) {
            setError('Please enter a user address');
            setLoading(false);
            return;
          }
          events = await queryEventsByUser(userAddress, limit);
          break;
        case 'by-asset':
          if (!assetAddress) {
            setError('Please enter an asset address');
            setLoading(false);
            return;
          }
          events = await queryEventsByAsset(assetAddress, limit);
          break;
      }

      const enhanced = events.map(enhanceEvent);
      setResults(enhanced);
    } catch (err) {
      console.error('Query error:', err);
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Query Builder
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build custom queries to explore Aave V3 events
        </p>
      </div>

      {/* Query Builder Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          {/* Query Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Query Type
            </label>
            <select
              value={queryType}
              onChange={(e) => setQueryType(e.target.value as QueryType)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Events</option>
              <option value="by-type">By Event Type</option>
              <option value="by-user">By User Address</option>
              <option value="by-asset">By Asset Address</option>
            </select>
          </div>

          {/* Event Type Selection (shown when by-type is selected) */}
          {queryType === 'by-type' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Withdraw">Withdraw</option>
                <option value="Supply">Supply</option>
                <option value="FlashLoan">Flash Loan</option>
                <option value="LiquidationCall">Liquidation Call</option>
              </select>
            </div>
          )}

          {/* User Address Input */}
          {queryType === 'by-user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Address
              </label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Asset Address Input */}
          {queryType === 'by-asset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Address
              </label>
              <input
                type="text"
                value={assetAddress}
                onChange={(e) => setAssetAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Limit
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
              min="1"
              max="1000"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={executeQuery}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Executing Query...' : 'Execute Query'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Results ({results.length})
            </h2>
            <button
              onClick={() => {
                const json = JSON.stringify(results, null, 2);
                navigator.clipboard.writeText(json);
                alert('Copied to clipboard!');
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
            >
              📋 Copy JSON
            </button>
          </div>

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
                {results.map((event, idx) => {
                  const asset = event.reserve || event.asset || event.collateralAsset || '-';
                  const user = event.user || event.initiator || event.liquidator || '-';
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {formatEventType(event.eventType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{event.amountUSD || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{formatAddress(user)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{event.timestamp ? formatTimestamp(event.timestamp) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {event.txHash ? (
                          <a
                            href={`https://explorer.mendoza.hoodi.arkiv.network/tx/${event.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {formatAddress(event.txHash)}
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !error && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ready to Query
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select your query parameters above and click Execute Query
          </p>
        </div>
      )}
    </div>
  );
}
