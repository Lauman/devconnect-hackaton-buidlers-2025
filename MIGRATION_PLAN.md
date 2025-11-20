# Frontend-Backend Data Alignment Migration Plan

## Overview

This document outlines the plan to adapt the frontend analytics dashboard to work with the real Aave V3 event data from the backend. **The backend is the source of truth** - we will modify only the frontend to accommodate the backend's data structure.

---

## Backend Data Structure (Source of Truth)

The backend listens to real Aave V3 smart contract events and pushes them to Arkiv. We will NOT modify this structure.

### Event Types Supported

1. **withdraw** - User withdraws assets from Aave
2. **supply** - User supplies/deposits assets to Aave
3. **flash-loan** - Flash loan executed
4. **liquidation-call** - Liquidation event

### Attribute Schema (Immutable)

**Withdraw:**
```typescript
attributes: [
  { key: "protocol", value: "aave-v3" },
  { key: "event-type", value: "withdraw" },
  { key: "reserve", value: string },      // Token contract address
  { key: "user", value: string },         // User wallet address
  { key: "to", value: string },           // Recipient address
  { key: "amount", value: string },       // BigInt as string (wei)
  { key: "txHash", value: string }        // Transaction hash
]

payload: {
  reserve: string,
  user: string,
  to: string,
  amount: string,
  txHash: string
}
```

**Supply:**
```typescript
attributes: [
  { key: "protocol", value: "aave-v3" },
  { key: "event-type", value: "supply" },
  { key: "reserve", value: string },
  { key: "user", value: string },
  { key: "onBehalfOf", value: string },
  { key: "amount", value: string },
  { key: "referralCode", value: string },
  { key: "txHash", value: string }
]

payload: {
  reserve: string,
  user: string,
  onBehalfOf: string,
  amount: string,
  referralCode: string,
  txHash: string
}
```

**FlashLoan (flash-loan):**
```typescript
attributes: [
  { key: "protocol", value: "aave-v3" },
  { key: "event-type", value: "flash-loan" },
  { key: "target", value: string },
  { key: "initiator", value: string },
  { key: "asset", value: string },
  { key: "amount", value: string },
  { key: "interestRateMode", value: string },
  { key: "premium", value: string },
  { key: "referralCode", value: string },
  { key: "txHash", value: string }
]

payload: {
  target: string,
  initiator: string,
  asset: string,
  amount: string,
  interestRateMode: string,
  premium: string,
  referralCode: string,
  txHash: string
}
```

**LiquidationCall (liquidation-call):**
```typescript
attributes: [
  { key: "protocol", value: "aave-v3" },
  { key: "event-type", value: "liquidation-call" },
  { key: "collateralAsset", value: string },
  { key: "debtAsset", value: string },
  { key: "user", value: string },
  { key: "debtToCover", value: string },
  { key: "liquidatedCollateralAmount", value: string },
  { key: "liquidator", value: string },
  { key: "receiveAToken", value: string },
  { key: "txHash", value: string }
]

payload: {
  collateralAsset: string,
  debtAsset: string,
  user: string,
  debtToCover: string,
  liquidatedCollateralAmount: string,
  liquidator: string,
  receiveAToken: boolean,
  txHash: string
}
```

### Backend Constraints

- ❌ No `entityType` attribute
- ❌ No `timestamp` in attributes (only in block metadata)
- ❌ No USD values (only raw token amounts in wei)
- ❌ Token addresses (not symbols like "USDC", "WETH")
- ❌ Event type values are kebab-case: `"withdraw"`, `"flash-loan"`, etc.
- ❌ Attribute keys are kebab-case: `"event-type"` not `"eventType"`
- ❌ Only Aave V3 events (no Uniswap, Borrow, or Repay yet)

---

## Frontend Adaptations Required

### 1. Type System Overhaul

**File**: `frontend/src/lib/types.ts`

**Current Issues:**
- Expects `entityType: "protocol_event"` attribute
- Expects `eventType` in PascalCase (`"Withdraw"`, `"Supply"`)
- Expects `amountUSD` field
- Expects `timestamp` field
- Generic `AaveEvent` type doesn't match real events

**Required Changes:**

```typescript
// Real backend event types (match payload structure exactly)
export interface WithdrawEvent {
  reserve: string;        // Token contract address
  user: string;           // User wallet
  to: string;             // Recipient wallet
  amount: string;         // BigInt as string (wei)
  txHash: string;         // Transaction hash
}

export interface SupplyEvent {
  reserve: string;
  user: string;
  onBehalfOf: string;
  amount: string;
  referralCode: string;
  txHash: string;
}

export interface FlashLoanEvent {
  target: string;         // Flash loan receiver contract
  initiator: string;      // Initiator address
  asset: string;          // Asset address
  amount: string;
  interestRateMode: string;
  premium: string;
  referralCode: string;
  txHash: string;
}

export interface LiquidationCallEvent {
  collateralAsset: string;
  debtAsset: string;
  user: string;
  debtToCover: string;
  liquidatedCollateralAmount: string;
  liquidator: string;
  receiveAToken: boolean;
  txHash: string;
}

// Union type for all real Aave events
export type AaveRealEvent =
  | WithdrawEvent
  | SupplyEvent
  | FlashLoanEvent
  | LiquidationCallEvent;

// Enhanced parsed entity with computed fields
export interface ParsedAaveEvent<T extends AaveRealEvent = AaveRealEvent> extends T {
  entityKey: string;           // From Arkiv entity.key
  eventType: string;           // Computed from attributes: "withdraw", "supply", etc.
  protocol: "aave-v3";         // Always aave-v3
  timestamp?: string;          // Computed from createdAtBlock or current time
  amountUSD?: string;          // Computed client-side
  reserveSymbol?: string;      // Computed from reserve address
}

// Type guards for event discrimination
export function isWithdrawEvent(event: AaveRealEvent): event is WithdrawEvent {
  return "to" in event && "reserve" in event;
}

export function isSupplyEvent(event: AaveRealEvent): event is SupplyEvent {
  return "onBehalfOf" in event && "referralCode" in event;
}

export function isFlashLoanEvent(event: AaveRealEvent): event is FlashLoanEvent {
  return "target" in event && "initiator" in event && "asset" in event;
}

export function isLiquidationCallEvent(event: AaveRealEvent): event is LiquidationCallEvent {
  return "collateralAsset" in event && "debtAsset" in event;
}

// Filter interface - now uses backend's attribute naming
export interface EventFilters {
  protocol?: "aave-v3" | "all";
  eventType?: "withdraw" | "supply" | "flash-loan" | "liquidation-call" | "all";  // ✅ kebab-case
  asset?: string;        // Token address or symbol
  user?: string;         // Wallet address
  minAmount?: string;
  maxAmount?: string;
}
```

### 2. Query Functions Rewrite

**File**: `frontend/src/lib/queries.ts`

**Required Changes:**

```typescript
import { getArkivClient } from "./arkiv";
import { eq } from "@arkiv-network/sdk/query";
import type {
  AaveRealEvent,
  ParsedAaveEvent,
  EventFilters,
  WithdrawEvent,
  SupplyEvent,
  FlashLoanEvent,
  LiquidationCallEvent
} from "./types";

const client = getArkivClient();

/**
 * Parse Arkiv entity into typed event with metadata
 */
function parseAaveEntity(entity: any): ParsedAaveEvent {
  // Decode payload
  const text = new TextDecoder().decode(entity.payload);
  const data = JSON.parse(text) as AaveRealEvent;

  // Extract event type from attributes
  const eventTypeAttr = entity.attributes?.find((a: any) => a.key === "event-type");
  const eventType = eventTypeAttr?.value || "unknown";

  // Compute timestamp from block number (12s per block average)
  const timestamp = entity.createdAtBlock
    ? new Date(entity.createdAtBlock * 12000).toISOString()
    : new Date().toISOString();

  return {
    ...data,
    entityKey: entity.key,
    eventType,
    protocol: "aave-v3",
    timestamp,
  };
}

/**
 * Query all Aave V3 events
 * Uses "protocol" attribute which exists on all events
 */
export async function queryAllAaveEvents(limit = 100): Promise<ParsedAaveEvent[]> {
  const result = await client
    .buildQuery()
    .where(eq("protocol", "aave-v3"))  // ✅ Backend uses this attribute
    .withPayload(true)
    .withAttributes(true)
    .fetch();

  return result.entities
    .map(parseAaveEntity)
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
    .slice(0, limit);
}

/**
 * Query events by type
 * Uses "event-type" attribute with kebab-case values
 */
export async function queryEventsByType(
  eventType: "withdraw" | "supply" | "flash-loan" | "liquidation-call",
  limit = 100
): Promise<ParsedAaveEvent[]> {
  const result = await client
    .buildQuery()
    .where(eq("event-type", eventType))  // ✅ Backend uses "event-type" not "eventType"
    .withPayload(true)
    .withAttributes(true)
    .fetch();

  return result.entities
    .map(parseAaveEntity)
    .slice(0, limit);
}

/**
 * Query withdraw events specifically
 */
export async function queryWithdrawEvents(limit = 100): Promise<ParsedAaveEvent<WithdrawEvent>[]> {
  return queryEventsByType("withdraw", limit) as Promise<ParsedAaveEvent<WithdrawEvent>[]>;
}

/**
 * Query supply events specifically
 */
export async function querySupplyEvents(limit = 100): Promise<ParsedAaveEvent<SupplyEvent>[]> {
  return queryEventsByType("supply", limit) as Promise<ParsedAaveEvent<SupplyEvent>[]>;
}

/**
 * Query flash loan events specifically
 */
export async function queryFlashLoanEvents(limit = 100): Promise<ParsedAaveEvent<FlashLoanEvent>[]> {
  return queryEventsByType("flash-loan", limit) as Promise<ParsedAaveEvent<FlashLoanEvent>[]>;
}

/**
 * Query liquidation events specifically
 */
export async function queryLiquidationEvents(limit = 100): Promise<ParsedAaveEvent<LiquidationCallEvent>[]> {
  return queryEventsByType("liquidation-call", limit) as Promise<ParsedAaveEvent<LiquidationCallEvent>[]>;
}

/**
 * Query events by user address
 * Must use client-side filtering since we can only use one .where() clause
 */
export async function queryEventsByUser(userAddress: string, limit = 100): Promise<ParsedAaveEvent[]> {
  // Query all Aave events first
  const allEvents = await queryAllAaveEvents(1000);

  // Filter client-side for user
  return allEvents.filter(event => {
    if ("user" in event && event.user.toLowerCase() === userAddress.toLowerCase()) {
      return true;
    }
    if ("initiator" in event && event.initiator.toLowerCase() === userAddress.toLowerCase()) {
      return true;
    }
    return false;
  }).slice(0, limit);
}

/**
 * Query events by asset/reserve address
 * Client-side filtering since Arkiv only supports one .where() clause
 */
export async function queryEventsByAsset(assetAddress: string, limit = 100): Promise<ParsedAaveEvent[]> {
  const allEvents = await queryAllAaveEvents(1000);

  return allEvents.filter(event => {
    const eventAsset = ("reserve" in event && event.reserve) ||
                       ("asset" in event && event.asset) ||
                       ("collateralAsset" in event && event.collateralAsset);

    return eventAsset?.toLowerCase() === assetAddress.toLowerCase();
  }).slice(0, limit);
}

/**
 * Query with complex filters
 * Uses priority-based querying + client-side filtering
 */
export async function queryEventsWithFilters(filters: EventFilters): Promise<ParsedAaveEvent[]> {
  let events: ParsedAaveEvent[];

  // Priority 1: Query by event type if specified (most selective)
  if (filters.eventType && filters.eventType !== "all") {
    events = await queryEventsByType(filters.eventType, 1000);
  }
  // Priority 2: Query by protocol (fallback)
  else {
    events = await queryAllAaveEvents(1000);
  }

  // Apply client-side filters
  if (filters.user) {
    events = events.filter(event => {
      const eventUser = ("user" in event && event.user) ||
                       ("initiator" in event && event.initiator);
      return eventUser?.toLowerCase() === filters.user!.toLowerCase();
    });
  }

  if (filters.asset) {
    events = events.filter(event => {
      const eventAsset = ("reserve" in event && event.reserve) ||
                        ("asset" in event && event.asset);
      return eventAsset?.toLowerCase() === filters.asset!.toLowerCase();
    });
  }

  if (filters.minAmount) {
    events = events.filter(event => {
      const amount = parseFloat(event.amount || "0");
      return amount >= parseFloat(filters.minAmount!);
    });
  }

  if (filters.maxAmount) {
    events = events.filter(event => {
      const amount = parseFloat(event.amount || "0");
      return amount <= parseFloat(filters.maxAmount!);
    });
  }

  return events;
}

/**
 * Calculate statistics from events
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  totalVolumeWei: Record<string, string>;  // By asset address
  uniqueUsers: number;
  recentEvents: ParsedAaveEvent[];
}

export async function calculateEventStats(): Promise<EventStats> {
  const events = await queryAllAaveEvents(1000);

  const stats: EventStats = {
    totalEvents: events.length,
    eventsByType: {},
    totalVolumeWei: {},
    uniqueUsers: 0,
    recentEvents: events.slice(0, 10),
  };

  const uniqueUserSet = new Set<string>();

  events.forEach(event => {
    // Count by event type
    stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;

    // Track unique users
    if ("user" in event) uniqueUserSet.add(event.user.toLowerCase());
    if ("initiator" in event) uniqueUserSet.add(event.initiator.toLowerCase());
    if ("liquidator" in event) uniqueUserSet.add(event.liquidator.toLowerCase());

    // Calculate volumes by asset (in wei)
    const asset = ("reserve" in event && event.reserve) ||
                 ("asset" in event && event.asset) ||
                 ("collateralAsset" in event && event.collateralAsset);

    const amount = event.amount ||
                  ("liquidatedCollateralAmount" in event && event.liquidatedCollateralAmount) ||
                  "0";

    if (asset) {
      const currentVolume = BigInt(stats.totalVolumeWei[asset] || "0");
      const eventAmount = BigInt(amount);
      stats.totalVolumeWei[asset] = (currentVolume + eventAmount).toString();
    }
  });

  stats.uniqueUsers = uniqueUserSet.size;
  return stats;
}
```

### 3. Utility Functions for Data Enhancement

**File**: `frontend/src/lib/utils.ts` (create if doesn't exist)

```typescript
/**
 * Token address to symbol mapping
 * Add more tokens as needed
 */
export const TOKEN_ADDRESS_TO_SYMBOL: Record<string, string> = {
  // Mainnet addresses (lowercase)
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVE",
  // Add testnet addresses here
};

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
};

/**
 * Convert token address to symbol
 */
export function getTokenSymbol(address: string): string {
  const symbol = TOKEN_ADDRESS_TO_SYMBOL[address.toLowerCase()];
  if (symbol) return symbol;

  // Fallback: show shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert wei amount to human-readable token amount
 */
export function formatTokenAmount(amountWei: string, tokenAddress: string): string {
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
}

/**
 * Mock USD price data (replace with real price API in production)
 */
export const MOCK_TOKEN_PRICES: Record<string, number> = {
  "USDC": 1.0,
  "USDT": 1.0,
  "DAI": 1.0,
  "WETH": 2500,
  "WBTC": 45000,
  "AAVE": 150,
};

/**
 * Calculate USD value from wei amount
 * TODO: Replace with real-time price oracle (Chainlink, Coingecko, etc.)
 */
export function calculateUSDValue(amountWei: string, tokenAddress: string): number {
  const symbol = getTokenSymbol(tokenAddress);
  const decimals = TOKEN_DECIMALS[symbol] || 18;
  const price = MOCK_TOKEN_PRICES[symbol] || 0;

  const amount = Number(amountWei) / (10 ** decimals);
  return amount * price;
}

/**
 * Format USD value for display
 */
export function formatUSD(amountUSD: number): string {
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
 */
export function enhanceEvent<T extends ParsedAaveEvent>(event: T): T {
  const asset = ("reserve" in event && event.reserve) ||
               ("asset" in event && event.asset) ||
               ("collateralAsset" in event && event.collateralAsset);

  const amount = event.amount ||
                ("liquidatedCollateralAmount" in event && event.liquidatedCollateralAmount) ||
                "0";

  return {
    ...event,
    reserveSymbol: asset ? getTokenSymbol(asset) : undefined,
    amountUSD: asset ? formatUSD(calculateUSDValue(amount, asset)) : undefined,
  };
}
```

### 4. Component Updates

**File**: `frontend/src/components/StatsCards.tsx`

```typescript
import { ParsedAaveEvent } from "@/lib/types";
import { formatTokenAmount, calculateUSDValue, formatUSD, getTokenSymbol } from "@/lib/utils";

interface StatsCardsProps {
  events: ParsedAaveEvent[];
}

export function StatsCards({ events }: StatsCardsProps) {
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
      if ("user" in event) users.push(event.user);
      if ("initiator" in event) users.push(event.initiator);
      if ("liquidator" in event) users.push(event.liquidator);
      return users;
    })
  ).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {events.length.toLocaleString()}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Volume</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {formatUSD(totalVolumeUSD)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {uniqueUsers.toLocaleString()}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Types</h3>
        <div className="mt-2 space-y-1">
          {Object.entries(eventCounts).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300 capitalize">
                {type.replace("-", " ")}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5. Query Builder Updates

**File**: `frontend/src/components/QueryBuilder.tsx`

Update to use backend's event type values:

```typescript
// Update event type options to match backend
const eventTypeOptions = [
  { value: "all", label: "All Events" },
  { value: "withdraw", label: "Withdraw" },        // ✅ kebab-case
  { value: "supply", label: "Supply" },
  { value: "flash-loan", label: "Flash Loan" },    // ✅ kebab-case
  { value: "liquidation-call", label: "Liquidation" }, // ✅ kebab-case
];
```

### 6. Analytics Page Updates

**File**: `frontend/src/app/analytics/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { ParsedAaveEvent } from "@/lib/types";
import { queryAllAaveEvents, calculateEventStats, type EventStats } from "@/lib/queries";
import { enhanceEvent } from "@/lib/utils";
import { StatsCards } from "@/components/StatsCards";
import { EventTable } from "@/components/EventTable";
import { EventDistributionChart } from "@/components/EventDistributionChart";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<ParsedAaveEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events from Arkiv
      const fetchedEvents = await queryAllAaveEvents(100);

      // Enhance with computed fields
      const enhanced = fetchedEvents.map(enhanceEvent);

      setEvents(enhanced);

      // Calculate stats
      const calculatedStats = await calculateEventStats();
      setStats(calculatedStats);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading real Aave V3 events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Aave V3 Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time Aave V3 events from Arkiv Network
        </p>
        {loading && (
          <p className="text-sm text-blue-500 mt-1">Refreshing...</p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No events found. Make sure the backend is running and generating events.
          </p>
        </div>
      ) : (
        <>
          <StatsCards events={events} />

          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <EventDistributionChart
                data={Object.entries(stats.eventsByType).map(([name, value]) => ({
                  name: name.replace("-", " "),
                  value
                }))}
              />
            </div>
          )}

          <EventTable events={events.slice(0, 20)} />
        </>
      )}
    </div>
  );
}
```

### 7. Event Table Component

**File**: `frontend/src/components/EventTable.tsx` (create new)

```typescript
import { ParsedAaveEvent } from "@/lib/types";
import { formatTokenAmount, getTokenSymbol } from "@/lib/utils";

interface EventTableProps {
  events: ParsedAaveEvent[];
}

export function EventTable({ events }: EventTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Events
        </h2>
      </div>

      <div className="overflow-x-auto">
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
                USD Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tx Hash
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => {
              const asset = ("reserve" in event && event.reserve) ||
                           ("asset" in event && event.asset) ||
                           ("collateralAsset" in event && event.collateralAsset) || "";

              const amount = event.amount ||
                           ("liquidatedCollateralAmount" in event && event.liquidatedCollateralAmount) ||
                           "0";

              const user = ("user" in event && event.user) ||
                          ("initiator" in event && event.initiator) || "";

              return (
                <tr key={event.entityKey}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {event.eventType.replace("-", " ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {getTokenSymbol(asset)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatTokenAmount(amount, asset)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {event.amountUSD || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {user.slice(0, 6)}...{user.slice(-4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-mono">
                    <a
                      href={`https://etherscan.io/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {event.txHash.slice(0, 6)}...{event.txHash.slice(-4)}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Core Type & Query Updates (2-3 hours)

- [ ] Create/update `frontend/src/lib/types.ts` with real backend event types
- [ ] Add type guards for event discrimination
- [ ] Rewrite `frontend/src/lib/queries.ts` to use backend attribute names
  - [ ] Use `"event-type"` not `"eventType"`
  - [ ] Use kebab-case values: `"withdraw"`, `"flash-loan"`, etc.
  - [ ] Remove `entityType` queries
- [ ] Test queries with `npx tsx test-new-data.ts`

### Phase 2: Utility Functions (1 hour)

- [ ] Create `frontend/src/lib/utils.ts`
- [ ] Add token address-to-symbol mapping
- [ ] Add token decimals mapping
- [ ] Implement `formatTokenAmount()` function
- [ ] Implement `calculateUSDValue()` with mock prices
- [ ] Implement `enhanceEvent()` helper

### Phase 3: Component Updates (2-3 hours)

- [ ] Update `StatsCards.tsx` to handle real event structure
- [ ] Create `EventTable.tsx` component
- [ ] Update `QueryBuilder.tsx` with kebab-case event types
- [ ] Update `EventDistributionChart.tsx` if needed
- [ ] Remove Uniswap-related components (optional)

### Phase 4: Page Updates (1 hour)

- [ ] Update `frontend/src/app/analytics/page.tsx`
- [ ] Update `frontend/src/app/query/page.tsx`
- [ ] Remove mock data references
- [ ] Add loading and error states

### Phase 5: Testing & Refinement (2 hours)

- [ ] Generate real events from backend
- [ ] Verify events appear in frontend
- [ ] Test all filter combinations
- [ ] Verify USD calculations
- [ ] Test table rendering
- [ ] Check responsive design
- [ ] Verify auto-refresh works

---

## Testing Strategy

### 1. Backend Event Generation

```bash
# Start backend services
cd backend
npm run start

# This will:
# - Start Redis
# - Start event listeners
# - Start worker to push to Arkiv
```

### 2. Generate Test Events

Interact with Aave V3 contract on testnet to trigger events:
- Supply some test tokens
- Withdraw tokens
- Trigger a liquidation (if possible)

### 3. Verify in Arkiv Explorer

Visit: https://explorer.mendoza.hoodi.arkiv.network/

Search for entities with `protocol = "aave-v3"` attribute

### 4. Frontend Testing

```bash
cd frontend
npm run dev
```

Visit http://localhost:3001/analytics

**Expected behavior:**
- ✅ Events appear in table
- ✅ Stats cards show correct counts
- ✅ USD values calculated (using mock prices)
- ✅ Token symbols display correctly
- ✅ Event types display as "Withdraw", "Supply", etc.
- ✅ Charts render without errors

---

## Troubleshooting

### Issue: No events found

**Cause:** Backend not running or no events generated yet

**Solution:**
```bash
cd backend
npm run start
# Interact with Aave V3 contract to generate events
```

### Issue: Events found but payload parsing fails

**Cause:** Payload structure doesn't match expected types

**Solution:**
- Check actual payload structure in Arkiv Explorer
- Update type definitions to match
- Add error handling in `parseAaveEntity()`

### Issue: USD values showing as $0

**Cause:** Token address not in mock price mapping

**Solution:**
- Add token address to `TOKEN_ADDRESS_TO_SYMBOL` in utils.ts
- Add price to `MOCK_TOKEN_PRICES`

### Issue: Query returns 0 results

**Cause:** Using wrong attribute names

**Solution:**
- Verify backend uses `"protocol": "aave-v3"`
- Use `.withAttributes(true)` to inspect actual attribute keys
- Update queries to match backend's exact attribute naming

---

## Future Enhancements

### 1. Real-time Price Integration

Replace mock prices with real API:

```typescript
// Use Coingecko API
async function fetchTokenPrice(symbol: string): Promise<number> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
  );
  const data = await response.json();
  return data[symbol].usd;
}
```

### 2. Add More Event Types

When backend adds Borrow/Repay:
- Update type definitions
- Add to query functions
- Update UI components

### 3. WebSocket Subscriptions

Real-time updates instead of polling:

```typescript
const subscription = client.subscribe({
  where: eq("protocol", "aave-v3"),
  onData: (entity) => {
    const event = parseAaveEntity(entity);
    setEvents(prev => [event, ...prev]);
  }
});
```

### 4. Historical Data Sync

Backfill historical events:
- Query Aave subgraph for past events
- Push to Arkiv with proper attributes
- Display historical trends

---

## Success Criteria

✅ Frontend displays real Aave V3 events from backend
✅ All query functions work with backend's attribute schema
✅ USD values calculated client-side
✅ Token symbols displayed correctly
✅ Event type filters work with kebab-case values
✅ Charts render without errors
✅ No TypeScript compilation errors
✅ Auto-refresh updates with new events
✅ Table displays all event fields correctly

---

## Timeline Estimate

- **Type & Query Updates**: 2-3 hours
- **Utility Functions**: 1 hour
- **Component Updates**: 2-3 hours
- **Testing & Debugging**: 2 hours
- **Total**: ~7-9 hours

---

## Rollback Plan

If issues arise:

```bash
git stash
git checkout main
```

Keep separate branch for testing:

```bash
git checkout -b feature/backend-integration
# Make changes
git commit -m "WIP: Backend integration"
```

Merge only when fully tested.
