import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';

// Singleton pattern for public client
let publicClientInstance: ReturnType<typeof createPublicClient> | null = null;

export function getArkivPublicClient() {
  if (!publicClientInstance) {
    publicClientInstance = createPublicClient({
      chain: mendoza,
      transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
    });
  }
  return publicClientInstance;
}

// For client-side components
export function getArkivClientForBrowser() {
  return createPublicClient({
    chain: mendoza,
    transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
  });
}
