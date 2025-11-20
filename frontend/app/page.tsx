import StatsCards from '@/components/StatsCards';
import EventsTable from '@/components/EventsTable';
import { queryAllEvents } from '@/lib/queries';
import type { ParsedEvent } from '@/lib/types';

export default async function HomePage() {
  // Fetch data on the server
  let events: ParsedEvent[] = [];
  try {
    events = await queryAllEvents(50);
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Arkiv Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time analytics for Aave protocol events on Arkiv Network
        </p>
      </div>

      <div className="mb-8">
        <StatsCards events={events} />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
        <EventsTable initialEvents={events} />
      </div>
    </div>
  );
}

// Revalidate every 30 seconds
export const revalidate = 30;
