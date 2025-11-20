'use client';

import { useState } from 'react';
import type { EntityType, ProtocolType, EventType } from '@/lib/types';

export interface QueryConfig {
  entityType?: EntityType | 'all';
  protocol?: ProtocolType | 'all';
  eventType?: EventType | 'all';
  asset?: string;
  user?: string;
  minAmount?: string;
  maxAmount?: string;
  limit?: number;
  chartType?: 'table' | 'bar' | 'pie' | 'line';
}

interface QueryBuilderProps {
  onExecute: (config: QueryConfig) => void;
  loading?: boolean;
}

export default function QueryBuilder({ onExecute, loading = false }: QueryBuilderProps) {
  const [config, setConfig] = useState<QueryConfig>({
    entityType: 'all',
    protocol: 'all',
    eventType: 'all',
    asset: '',
    user: '',
    minAmount: '',
    maxAmount: '',
    limit: 100,
    chartType: 'table',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecute(config);
  };

  const handleReset = () => {
    setConfig({
      entityType: 'all',
      protocol: 'all',
      eventType: 'all',
      asset: '',
      user: '',
      minAmount: '',
      maxAmount: '',
      limit: 100,
      chartType: 'table',
    });
  };

  // Get available event types based on selected protocol
  const getEventTypeOptions = () => {
    if (config.protocol === 'aave-v3') {
      return ['Supply', 'Borrow', 'Withdraw', 'Repay', 'LiquidationCall'];
    } else if (config.protocol === 'uniswap-v3') {
      return ['Swap'];
    } else {
      // All protocols - show all event types
      return ['Supply', 'Borrow', 'Withdraw', 'Repay', 'LiquidationCall', 'Swap'];
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Query Builder</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Build custom queries to analyze DeFi protocol data stored on Arkiv DB-chain
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entity Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Entity Type</label>
          <select
            value={config.entityType}
            onChange={(e) => setConfig({ ...config, entityType: e.target.value as any })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
          >
            <option value="all">All Entity Types</option>
            <option value="protocol_event">Protocol Events</option>
            <option value="aggregated_metric">Aggregated Metrics</option>
            <option value="price_snapshot">Price Snapshots</option>
          </select>
        </div>

        {/* Protocol Filter - Only show for protocol events */}
        {(config.entityType === 'all' || config.entityType === 'protocol_event') && (
          <div>
            <label className="block text-sm font-medium mb-2">Protocol</label>
            <select
              value={config.protocol}
              onChange={(e) => setConfig({ ...config, protocol: e.target.value as any, eventType: 'all' })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
            >
              <option value="all">All Protocols</option>
              <option value="aave-v3">Aave V3</option>
              <option value="uniswap-v3">Uniswap V3</option>
            </select>
          </div>
        )}

        {/* Event Type Filter - Only show for protocol events */}
        {(config.entityType === 'all' || config.entityType === 'protocol_event') && (
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <select
              value={config.eventType}
              onChange={(e) => setConfig({ ...config, eventType: e.target.value as any })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
            >
              <option value="all">All Event Types</option>
              {getEventTypeOptions().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Asset Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Asset</label>
          <select
            value={config.asset}
            onChange={(e) => setConfig({ ...config, asset: e.target.value })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
          >
            <option value="">All Assets</option>
            <option value="USDC">USDC</option>
            <option value="WETH">WETH</option>
            <option value="DAI">DAI</option>
            <option value="USDT">USDT</option>
            <option value="WBTC">WBTC</option>
            <option value="LINK">LINK</option>
          </select>
        </div>

        {/* User Address Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">User Address (optional)</label>
          <input
            type="text"
            value={config.user}
            onChange={(e) => setConfig({ ...config, user: e.target.value })}
            placeholder="0x..."
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
          />
        </div>

        {/* Amount Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Min Amount</label>
            <input
              type="number"
              value={config.minAmount}
              onChange={(e) => setConfig({ ...config, minAmount: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Amount</label>
            <input
              type="number"
              value={config.maxAmount}
              onChange={(e) => setConfig({ ...config, maxAmount: e.target.value })}
              placeholder="Unlimited"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
            />
          </div>
        </div>

        {/* Limit */}
        <div>
          <label className="block text-sm font-medium mb-2">Result Limit</label>
          <select
            value={config.limit}
            onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
          >
            <option value="10">10 results</option>
            <option value="25">25 results</option>
            <option value="50">50 results</option>
            <option value="100">100 results</option>
            <option value="500">500 results</option>
          </select>
        </div>

        {/* Visualization Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Visualization</label>
          <div className="grid grid-cols-4 gap-2">
            {(['table', 'bar', 'pie', 'line'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setConfig({ ...config, chartType: type })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  config.chartType === type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Executing...
              </span>
            ) : (
              '🔍 Execute Query'
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Query Preview */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Query Preview:</h3>
        <code className="text-xs text-gray-700 dark:text-gray-300">
          {generateQueryPreview(config)}
        </code>
      </div>
    </div>
  );
}

function generateQueryPreview(config: QueryConfig): string {
  const conditions = [];

  // Entity type
  if (config.entityType && config.entityType !== 'all') {
    conditions.push(`entityType = "${config.entityType}"`);
  }

  // Protocol
  if (config.protocol && config.protocol !== 'all') {
    conditions.push(`protocol = "${config.protocol}"`);
  }

  // Event type
  if (config.eventType && config.eventType !== 'all') {
    conditions.push(`eventType = "${config.eventType}"`);
  }

  // Asset
  if (config.asset) {
    conditions.push(`asset = "${config.asset}"`);
  }

  // User
  if (config.user) {
    conditions.push(`user = "${config.user}"`);
  }

  // Amount range
  if (config.minAmount) {
    conditions.push(`amountUSD >= ${config.minAmount}`);
  }
  if (config.maxAmount) {
    conditions.push(`amountUSD <= ${config.maxAmount}`);
  }

  const tableName = config.entityType === 'aggregated_metric' ? 'metrics' :
                     config.entityType === 'price_snapshot' ? 'prices' :
                     'events';

  const where = conditions.length > 0 ? conditions.join(' AND ') : 'entityType = "protocol_event"';
  return `SELECT * FROM ${tableName} WHERE ${where} LIMIT ${config.limit}`;
}
