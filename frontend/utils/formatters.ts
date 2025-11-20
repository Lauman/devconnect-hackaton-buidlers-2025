/**
 * Format a large number with commas
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

/**
 * Format a crypto amount with appropriate decimals
 */
export function formatCryptoAmount(amount: number | string, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(decimals);
}

/**
 * Shorten an Ethereum address
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Shorten a transaction hash
 */
export function shortenTxHash(hash: string, chars: number = 8): string {
  if (!hash || hash.length < chars + 3) return hash;
  return `${hash.slice(0, chars)}...`;
}

/**
 * Format a timestamp to a readable date
 */
export function formatDate(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get color class for event type badge
 */
export function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    Supply: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Borrow: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Withdraw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Repay: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    LiquidationCall: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

/**
 * Get Arkiv explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  return `https://explorer.mendoza.hoodi.arkiv.network/tx/${txHash}`;
}

/**
 * Get Arkiv explorer URL for address
 */
export function getExplorerAddressUrl(address: string): string {
  return `https://explorer.mendoza.hoodi.arkiv.network/address/${address}`;
}
