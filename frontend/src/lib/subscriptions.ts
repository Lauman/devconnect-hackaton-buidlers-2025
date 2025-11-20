import { getArkivClientForBrowser } from './arkiv';
import type { ParsedEvent } from './types';
import { parseEventPayload } from './queries';

export async function subscribeToNewEvents(
  onNewEvent: (event: ParsedEvent) => void
): Promise<() => void> {
  const client = getArkivClientForBrowser();

  const stopSubscription = await client.subscribeEntityEvents({
    onEntityCreated: async (event) => {
      try {
        // Fetch the full entity data using the entityKey
        const entity = await client.getEntity(event.entityKey);

        // Check if it's an Aave event
        const protocolAttr = entity.attributes?.find(a => a.key === 'protocol');
        if (protocolAttr?.value === 'aave-v3' && entity.payload) {
          const parsedEvent = parseEventPayload(entity.payload);
          onNewEvent({
            ...parsedEvent,
            entityKey: event.entityKey,
          });
        }
      } catch (error) {
        console.error('Failed to fetch entity:', error);
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
  });

  return stopSubscription;
}
