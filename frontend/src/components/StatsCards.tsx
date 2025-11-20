'use client';

import { ParsedAaveEvent } from "@/lib/types";
import { calculateUSDValue, formatUSD, formatEventType } from "@/lib/utils";

interface StatsCardsProps {
  events: ParsedAaveEvent[];
}

export default function StatsCards({ events }: StatsCardsProps) {
  // Handle undefined or empty events
  if (!events || events.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Volume</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$0.00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Event Types</h3>
          <p className="text-sm text-gray-400">No events</p>
        </div>
      </div>
    );
  }

  // Calculate total events by type
  const eventCounts = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total volume in USD
  const totalVolumeUSD = events.reduce((sum, event) => {
    const asset = ("reserve" in event && event.reserve) ||
                 ("asset" in event && event.asset) ||
                 ("collateralAsset" in event && event.collateralAsset);

    const amount = event.amount ||
                  ("liquidatedCollateralAmount" in event && event.liquidatedCollateralAmount) ||
                  "0";

    if (asset) {
      return sum + calculateUSDValue(amount, asset);
    }
    return sum;
  }, 0);

  // Calculate unique users
  const uniqueUsers = new Set(
    events.flatMap(event => {
      const users: string[] = [];
      if (event.user) users.push(event.user);
      if (event.initiator) users.push(event.initiator);
      if (event.liquidator) users.push(event.liquidator);
      return users;
    })
  ).size;

  // Get top event types (up to 3)
  const topEventTypes = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Events */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {events.length.toLocaleString()}
        </p>
      </div>

      {/* Total Volume */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Volume</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {formatUSD(totalVolumeUSD)}
        </p>
        <p className="text-xs text-gray-400 mt-1">Mock prices used</p>
      </div>

      {/* Unique Users */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {uniqueUsers.toLocaleString()}
        </p>
      </div>

      {/* Event Types Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Event Types</h3>
        <div className="space-y-2">
          {topEventTypes.length > 0 ? (
            topEventTypes.map(([type, count]) => (
              <div key={type} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300 capitalize">
                  {formatEventType(type)}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No events</p>
          )}
          {Object.keys(eventCounts).length > 3 && (
            <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">
              +{Object.keys(eventCounts).length - 3} more types
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
