'use client';

import { useState } from 'react';
import type { EventFilters } from '@/lib/types';

interface FilterBarProps {
  onFilterChange: (filters: EventFilters) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<EventFilters>({});

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Event Type
          </label>
          <select
            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Supply">Supply</option>
            <option value="Borrow">Borrow</option>
            <option value="Withdraw">Withdraw</option>
            <option value="Repay">Repay</option>
            <option value="LiquidationCall">Liquidation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Asset
          </label>
          <select
            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={(e) => handleFilterChange('asset', e.target.value)}
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

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            User Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={(e) => handleFilterChange('user', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Limit
          </label>
          <select
            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            defaultValue="50"
          >
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>
    </div>
  );
}
