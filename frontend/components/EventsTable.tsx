'use client';

import { useEffect, useState } from 'react';
import type { ParsedEvent } from '@/lib/types';
import { formatDistance } from 'date-fns';

interface EventsTableProps {
  initialEvents?: ParsedEvent[];
}

export default function EventsTable({ initialEvents = [] }: EventsTableProps) {
  const [events, setEvents] = useState<ParsedEvent[]>(initialEvents);
  const [loading, setLoading] = useState(!initialEvents.length);

  useEffect(() => {
    if (!initialEvents.length) {
      fetchEvents();
    }
  }, [initialEvents.length]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const response = await fetch('/api/events?limit=50');
      const json = await response.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No events found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Asset
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tx Hash
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {events.map((event) => (
            <tr key={event.entityKey} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <EventTypeBadge type={event.eventType} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium">{event.reserve}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {parseFloat(event.amount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                {event.user.slice(0, 6)}...{event.user.slice(-4)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                <a
                  href={`https://explorer.mendoza.hoodi.arkiv.network/tx/${event.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
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

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Supply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Borrow: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Withdraw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Repay: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    LiquidationCall: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
      {type}
    </span>
  );
}
