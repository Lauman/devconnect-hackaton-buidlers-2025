'use client';

import { useState } from 'react';
import { formatEventType } from '@/lib/utils';

export interface QueryConfig {
  protocol?: "aave-v3" | "all";
  eventType?: "withdraw" | "supply" | "flash-loan" | "liquidation-call" | "all";
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

  // Real Aave V3 event types from backend (kebab-case)
  const eventTypeOptions = [
    { value: 'withdraw', label: 'Withdraw' },
    { value: 'supply', label: 'Supply' },
    { value: 'flash-loan', label: 'Flash Loan' },
    { value: 'liquidation-call', label: 'Liquidation' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Query Builder</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Build custom queries to analyze real Aave V3 events stored on Arkiv DB-chain
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Protocol Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Protocol</label>
          <select
            value={config.protocol}
            onChange={(e) => setConfig({ ...config, protocol: e.target.value as any })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
          >
            <option value="all">All Protocols</option>
            <option value="aave-v3">Aave V3</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Currently only Aave V3 events are available</p>
        </div>

        {/* Event Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Event Type</label>
          <select
            value={config.eventType}
            onChange={(e) => setConfig({ ...config, eventType: e.target.value as any })}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
          >
            <option value="all">All Event Types</option>
            {eventTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

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
            <option value="AAVE">AAVE</option>
            <option value="LINK">LINK</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Filter by token symbol</p>
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

        {/* Amount Range (in wei) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Min Amount (wei)</label>
            <input
              type="number"
              value={config.minAmount}
              onChange={(e) => setConfig({ ...config, minAmount: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Amount (wei)</label>
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
        <h3 className="text-sm font-semibold mb-2">Arkiv Query Preview:</h3>
        <code className="text-xs text-gray-700 dark:text-gray-300">
          {generateQueryPreview(config)}
        </code>
      </div>
    </div>
  );
}

function generateQueryPreview(config: QueryConfig): string {
  const conditions = [];

  // Protocol (uses "protocol" attribute)
  if (config.protocol && config.protocol !== 'all') {
    conditions.push(`protocol = "${config.protocol}"`);
  }

  // Event type (uses "event-type" attribute with kebab-case values)
  if (config.eventType && config.eventType !== 'all') {
    conditions.push(`event-type = "${config.eventType}"`);
  }

  // Asset (client-side filter)
  if (config.asset) {
    conditions.push(`reserve = "${config.asset}" (client-side)`);
  }

  // User (client-side filter)
  if (config.user) {
    conditions.push(`user = "${config.user}" (client-side)`);
  }

  // Amount range (client-side filter)
  if (config.minAmount) {
    conditions.push(`amount >= ${config.minAmount} (client-side)`);
  }
  if (config.maxAmount) {
    conditions.push(`amount <= ${config.maxAmount} (client-side)`);
  }

  const where = conditions.length > 0 ? conditions.join(' AND ') : 'protocol = "aave-v3"';
  return `arkiv.buildQuery().where(${where}).limit(${config.limit})`;
}
