import { ParsedAaveEvent } from "./types";

// ============================================================================
// TOKEN ADDRESS TO SYMBOL MAPPING
// ============================================================================

/**
 * Token address to symbol mapping
 * Add more tokens as needed based on the Aave V3 pool you're using
 */
export const TOKEN_ADDRESS_TO_SYMBOL: Record<string, string> = {
  // Ethereum Mainnet addresses (lowercase)
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVE",
  "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",

  // Sepolia testnet addresses (add your testnet tokens here)
  // Example: "0x...": "USDC",
};

// ============================================================================
// TOKEN DECIMALS
// ============================================================================

/**
 * Token decimals mapping
 */
export const TOKEN_DECIMALS: Record<string, number> = {
  "USDC": 6,
  "USDT": 6,
  "WETH": 18,
  "DAI": 18,
  "WBTC": 8,
  "AAVE": 18,
  "LINK": 18,
};

// ============================================================================
// TOKEN PRICE MOCKS
// ============================================================================

/**
 * Mock USD price data (replace with real price API in production)
 * TODO: Integrate with Chainlink, Coingecko, or another price oracle
 */
export const MOCK_TOKEN_PRICES: Record<string, number> = {
  "USDC": 1.0,
  "USDT": 1.0,
  "DAI": 1.0,
  "WETH": 2500,
  "WBTC": 45000,
  "AAVE": 150,
  "LINK": 15,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert token address to symbol
 * @param address - Token contract address
 * @returns Token symbol or shortened address
 */
export function getTokenSymbol(address: string): string {
  if (!address) return "UNKNOWN";

  const symbol = TOKEN_ADDRESS_TO_SYMBOL[address.toLowerCase()];
  if (symbol) return symbol;

  // Fallback: show shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert wei amount to human-readable token amount
 * @param amountWei - Amount in wei as string
 * @param tokenAddress - Token contract address
 * @returns Formatted token amount with symbol
 */
export function formatTokenAmount(amountWei: string, tokenAddress: string): string {
  if (!amountWei || !tokenAddress) return "0";

  try {
    const symbol = getTokenSymbol(tokenAddress);
    const decimals = TOKEN_DECIMALS[symbol] || 18;

    const amount = BigInt(amountWei);
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;

    // Format with 2-6 decimal places depending on size
    if (wholePart > 1000n) {
      return `${wholePart.toLocaleString()} ${symbol}`;
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const decimalPlaces = Math.min(6, decimals);
    const formatted = `${wholePart}.${fractionalStr.slice(0, decimalPlaces)}`;

    return `${parseFloat(formatted).toLocaleString()} ${symbol}`;
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return `${amountWei} (raw)`;
  }
}

/**
 * Calculate USD value from wei amount
 * TODO: Replace with real-time price oracle (Chainlink, Coingecko, etc.)
 * @param amountWei - Amount in wei as string
 * @param tokenAddress - Token contract address
 * @returns USD value as number
 */
export function calculateUSDValue(amountWei: string, tokenAddress: string): number {
  if (!amountWei || !tokenAddress) return 0;

  try {
    const symbol = getTokenSymbol(tokenAddress);
    const decimals = TOKEN_DECIMALS[symbol] || 18;
    const price = MOCK_TOKEN_PRICES[symbol] || 0;

    const amount = Number(amountWei) / (10 ** decimals);
    return amount * price;
  } catch (error) {
    console.error("Error calculating USD value:", error);
    return 0;
  }
}

/**
 * Format USD value for display
 * @param amountUSD - USD amount as number
 * @returns Formatted USD string
 */
export function formatUSD(amountUSD: number): string {
  if (!amountUSD || isNaN(amountUSD)) return "$0.00";

  if (amountUSD >= 1_000_000) {
    return `$${(amountUSD / 1_000_000).toFixed(2)}M`;
  }
  if (amountUSD >= 1_000) {
    return `$${(amountUSD / 1_000).toFixed(2)}K`;
  }
  return `$${amountUSD.toFixed(2)}`;
}

/**
 * Enhance parsed event with computed fields
 * Adds reserveSymbol and amountUSD to events
 * @param event - Parsed Aave event
 * @returns Enhanced event with computed fields
 */
export function enhanceEvent(event: ParsedAaveEvent): ParsedAaveEvent {
  const asset = event.reserve || event.asset || event.collateralAsset || "";

  const amount = event.amount || event.liquidatedCollateralAmount || "0";

  return {
    ...event,
    reserveSymbol: asset ? getTokenSymbol(asset) : undefined,
    amountUSD: asset && amount ? formatUSD(calculateUSDValue(amount, asset)) : undefined,
  };
}

/**
 * Format wallet address for display
 * @param address - Wallet address
 * @returns Shortened address
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format timestamp for display
 * @param timestamp - ISO timestamp string
 * @returns Human-readable date/time
 */
export function formatTimestamp(timestamp: string): string {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return timestamp;
  }
}

/**
 * Convert event type from PascalCase to readable format
 * @param eventType - Event type from backend ("Withdraw", "FlashLoan", "LiquidationCall", etc.)
 * @returns Readable event type with spaces ("Withdraw", "Flash Loan", "Liquidation Call", etc.)
 */
export function formatEventType(eventType: string): string {
  // Handle PascalCase by adding spaces before capital letters
  return eventType
    .replace(/([A-Z])/g, ' $1')
    .trim();
}
