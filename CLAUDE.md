# Arkiv Analytics Dashboard - CLAUDE.md

## Project Overview

This is a **Dune Analytics-style dashboard** built for ETH Argentina Hackathon that queries and visualizes DeFi protocol events stored on **Arkiv Network's DB-chain**. It demonstrates how to build queryable, on-chain analytics using Arkiv's entity-attribute storage model.

### What Makes This Unique

- **On-chain queryable data**: All events are stored on Arkiv's Mendoza testnet blockchain
- **Attribute-based queries**: SQL-like filtering using entity attributes, not just by block/transaction
- **Multi-protocol support**: Tracks both Aave V3 (lending) and Uniswap V3 (DEX) events
- **Real-time analytics**: Dashboard auto-refreshes every 30 seconds
- **Dune-inspired UX**: Visual query builder with multiple chart types (table, bar, pie, line)

### Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Data Layer**: Arkiv Network SDK (@arkiv-network/sdk)
- **Blockchain**: Arkiv Mendoza Testnet (Chain ID: 60138453056)
- **Visualization**: Recharts
- **Data Processing**: date-fns for time formatting

---

## Core Concepts

### 1. Arkiv's Entity-Attribute Model

Unlike traditional blockchains where you query by block/tx, Arkiv uses an **entity-attribute storage model**:

```typescript
interface ArkivEntity {
  key: string; // Unique identifier (auto-generated)
  payload: Uint8Array; // Full JSON data (encoded)
  attributes: Array<{
    // Searchable metadata ← QUERY BY THESE
    key: string;
    value: string;
  }>;
  contentType: string;
  expiration: number; // TTL - entities can expire!
  owner: string; // Wallet address that created it
  createdAtBlock: number;
  lastModifiedAtBlock: number;
}
```

**Key Insight**: You query by **attributes** (like SQL WHERE clauses), not by entity key/name.

### 2. Three Entity Types

This project uses three distinct entity types:

#### A. Protocol Events (`protocol_event`)

Real-time DeFi transactions from Aave V3 and Uniswap V3:

```typescript
// Aave V3 Events
type AaveEventType =
  | "Supply"
  | "Borrow"
  | "Withdraw"
  | "Repay"
  | "LiquidationCall";

interface AaveEvent {
  entityType: "protocol_event";
  protocol: "aave-v3";
  eventType: AaveEventType;
  reserve: string; // Asset (USDC, WETH, etc.)
  user: string; // User wallet address
  amount: string; // Token amount
  amountUSD: string; // USD value
  txHash: string;
  timestamp: string;
  // ... event-specific fields
}

// Uniswap V3 Events
interface UniswapEvent {
  entityType: "protocol_event";
  protocol: "uniswap-v3";
  eventType: "Swap";
  tokenIn: string;
  tokenOut: string;
  amountInUSD: string;
  amountOutUSD: string;
  sender: string;
  recipient: string;
  // ... more fields
}
```

#### B. Aggregated Metrics (`aggregated_metric`)

Hourly summaries of protocol activity:

```typescript
interface AggregatedMetric {
  entityType: "aggregated_metric";
  metricType: "hourly_summary";
  protocol: "aave-v3" | "uniswap-v3";
  timeWindow: string; // ISO timestamp for the hour
  totalVolumeUSD: string;
  transactionCount: number;
  uniqueUsers: number;
  assetVolumes: Record<string, string>;
  eventTypeCounts: Record<string, number>;
  avgTransactionSizeUSD: string;
}
```

#### C. Price Snapshots (`price_snapshot`)

Token prices with 24-hour change tracking:

```typescript
interface PriceSnapshot {
  entityType: "price_snapshot";
  asset: string; // WETH, USDC, etc.
  priceUSD: string;
  timestamp: string;
  change24h: string; // Percentage change
  volume24hUSD: string;
  marketCapUSD?: string;
}
```

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Event Generator (Backend)                               │
│ /arkiv-first-contact/event-generator-v2.ts             │
│                                                         │
│ Generates mock DeFi events →                           │
│ Converts to attributes →                               │
│ Pushes to Arkiv DB-chain                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Arkiv Mendoza Testnet (DB-Chain)                       │
│ https://mendoza.hoodi.arkiv.network/rpc                │
│                                                         │
│ Stores entities with attributes for querying           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend Dashboard (This Project)                       │
│                                                         │
│ ┌─────────────────────────────────────────┐           │
│ │ Query Layer (src/lib/queries.ts)        │           │
│ │ • Priority-based attribute filtering     │           │
│ │ • Client-side complex filtering          │           │
│ │ • Payload decoding (Uint8Array → JSON)  │           │
│ └─────────────────────────────────────────┘           │
│                     │                                   │
│                     ▼                                   │
│ ┌─────────────────────────────────────────┐           │
│ │ Components & Pages                       │           │
│ │ • Analytics Dashboard                    │           │
│ │ • Query Builder                          │           │
│ │ • Protocol Comparison Charts             │           │
│ │ • Price History Charts                   │           │
│ └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── lib/
│   ├── arkiv.ts           # Arkiv SDK client setup
│   ├── types.ts           # TypeScript definitions for all entity types
│   └── queries.ts         # Query functions for fetching data
├── components/
│   ├── QueryBuilder.tsx               # Visual query builder UI
│   ├── QueryResults.tsx               # Results display with charts
│   ├── ProtocolComparisonChart.tsx    # Compare Aave vs Uniswap
│   ├── PriceHistoryChart.tsx          # Token price trends
│   ├── HourlyVolumeChart.tsx          # Volume over time
│   ├── VolumeChart.tsx                # Asset volume bar chart
│   ├── EventDistributionChart.tsx     # Event type pie chart
│   └── StatsCards.tsx                 # Key metrics cards
└── app/
    ├── layout.tsx         # Root layout with navigation
    ├── page.tsx           # Home page
    ├── analytics/
    │   └── page.tsx       # Analytics dashboard (main page)
    ├── query/
    │   └── page.tsx       # Query builder interface
    └── api/
        ├── events/route.ts    # Events API endpoint
        ├── stats/route.ts     # Stats API endpoint
        └── query/route.ts     # Query API endpoint
```

---

## Critical Patterns & Constraints

### 1. **Single WHERE Clause Limitation**

⚠️ **MOST IMPORTANT CONSTRAINT**: Arkiv queries support **only ONE** `.where()` clause.

```typescript
// ❌ DOES NOT WORK - Multiple where clauses
const result = await client
  .buildQuery()
  .where(eq("protocol", "aave-v3")) // Only this executes
  .where(eq("eventType", "Supply")) // ← IGNORED!
  .fetch();

// ✅ CORRECT - One where clause + client-side filtering
const result = await client
  .buildQuery()
  .where(eq("protocol", "aave-v3")) // Main filter
  .withPayload(true)
  .fetch();

const filtered = result.entities
  .map(parseEntity)
  .filter((e) => e.eventType === "Supply"); // Client-side filter
```

### 2. **Priority-Based Query Strategy**

We use a **priority hierarchy** to choose the most selective attribute for the main query:

```typescript
// From src/lib/queries.ts
export async function queryEventsWithFilters(filters: EventFilters) {
  let query = client.buildQuery();

  // Priority: entity type > protocol > specific filters
  if (filters.entityType && filters.entityType !== "all") {
    query = query.where(eq("entityType", filters.entityType));
  } else if (filters.protocol && filters.protocol !== "all") {
    query = query.where(eq("protocol", filters.protocol));
  } else if (filters.eventType && filters.eventType !== "all") {
    query = query.where(eq("eventType", filters.eventType));
  } else {
    query = query.where(eq("entityType", "protocol_event"));
  }

  // Fetch all matching entities
  const result = await query.withPayload(true).fetch();

  // Apply remaining filters client-side
  let events = result.entities.map(parseEntity);

  if (filters.asset) {
    events = events.filter(
      (e) =>
        e.reserve === filters.asset || // Aave
        e.tokenIn === filters.asset || // Uniswap
        e.tokenOut === filters.asset
    );
  }

  // ... more client-side filters
  return events;
}
```

### 3. **Payload Decoding Pattern**

All entity payloads are stored as `Uint8Array` and must be decoded:

```typescript
function parseEntity<T extends EntityData>(
  entity: ArkivEntity
): ParsedEntity<T> {
  // Decode Uint8Array to string, then parse JSON
  const text = new TextDecoder().decode(entity.payload);
  const data = JSON.parse(text) as T;

  // Add entity key for reference
  return {
    ...data,
    entityKey: entity.key,
  };
}
```

### 4. **Entity Expiration (TTL)**

⚠️ Entities on Arkiv have **expiration timestamps**. Data can disappear!

- Default TTL in event generator: 24 hours
- After expiration, entities are removed from the DB-chain
- This is why you might query and get 0 results

**Solution**: Re-run the event generator to populate fresh data.

---

## Common Query Patterns

### Query All Protocol Events

```typescript
const events = await client
  .buildQuery()
  .where(eq("entityType", "protocol_event"))
  .withPayload(true)
  .withAttributes(true)
  .fetch();
```

### Query by Protocol

```typescript
// Get all Aave V3 events
const aaveEvents = await client
  .buildQuery()
  .where(eq("protocol", "aave-v3"))
  .withPayload(true)
  .fetch();

// Get all Uniswap V3 events
const uniswapEvents = await client
  .buildQuery()
  .where(eq("protocol", "uniswap-v3"))
  .withPayload(true)
  .fetch();
```

### Query by Event Type

```typescript
// Get all Supply events
const supplyEvents = await client
  .buildQuery()
  .where(eq("eventType", "Supply"))
  .withPayload(true)
  .fetch();
```

### Query Aggregated Metrics

```typescript
const metrics = await client
  .buildQuery()
  .where(eq("entityType", "aggregated_metric"))
  .withPayload(true)
  .fetch();
```

### Query Price Snapshots for Specific Asset

```typescript
const wethPrices = await client
  .buildQuery()
  .where(eq("asset", "WETH"))
  .withPayload(true)
  .fetch();
```

---

## Type System

### Union Types for Polymorphic Entities

```typescript
// All possible protocol events
type ProtocolEvent = AaveEvent | UniswapEvent;

// All possible entity data types
type EntityData = ProtocolEvent | AggregatedMetric | PriceSnapshot;

// Parsed entity with key
interface ParsedEntity<T extends EntityData = EntityData> extends T {
  entityKey: string;
}
```

### Type Guards for Runtime Checking

```typescript
export function isAaveEvent(entity: EntityData): entity is AaveEvent {
  return (
    entity.entityType === "protocol_event" &&
    (entity as any).protocol === "aave-v3"
  );
}

export function isUniswapEvent(entity: EntityData): entity is UniswapEvent {
  return (
    entity.entityType === "protocol_event" &&
    (entity as any).protocol === "uniswap-v3"
  );
}

export function isAggregatedMetric(
  entity: EntityData
): entity is AggregatedMetric {
  return entity.entityType === "aggregated_metric";
}

export function isPriceSnapshot(entity: EntityData): entity is PriceSnapshot {
  return entity.entityType === "price_snapshot";
}
```

---

## Development Workflow

### 1. Generate Test Data

```bash
cd /Users/lucianolupo/projects/eth-argetina-hackaton/arkiv-first-contact
npx tsx event-generator-v2.ts 50 2000
```

This creates 50 entities with 2-second delay between each:

- Protocol events (Aave V3 + Uniswap V3)
- Aggregated metrics (hourly summaries)
- Price snapshots (token prices)

### 2. Test Queries

```bash
cd arkiv-first-contact-frontend
npx tsx test-new-data.ts
```

Verifies all entity types are queryable.

### 3. Run Development Server

```bash
npm run dev
```

Access at:

- Home: http://localhost:3001
- Analytics: http://localhost:3001/analytics
- Query Builder: http://localhost:3001/query

### 4. Query Builder Usage

1. Select **Entity Type** (Protocol Events, Metrics, or Prices)
2. Choose **Protocol** (Aave V3 or Uniswap V3) if filtering events
3. Set **Event Type** (Supply, Borrow, Swap, etc.)
4. Add **Asset**, **User**, or **Amount** filters
5. Choose **Visualization** (Table, Bar, Pie, Line)
6. Click **Execute Query**

---

## Key Files Reference

### `src/lib/types.ts`

**All TypeScript type definitions**

- Entity interfaces for all three types
- Event filters interface
- Type guards
- Arkiv entity response types

### `src/lib/queries.ts`

**Query function library**

- `queryAllEvents()` - Get all protocol events
- `queryAaveEvents()` - Get Aave V3 events
- `queryUniswapEvents()` - Get Uniswap V3 events
- `queryAggregatedMetrics()` - Get hourly metrics
- `queryPriceSnapshots()` - Get price data
- `queryEventsWithFilters()` - Complex filtering with priority strategy
- `calculateEventStats()` - Compute statistics

### `src/lib/arkiv.ts`

**Arkiv SDK client setup**

- Singleton pattern for client
- Connects to Mendoza testnet
- Uses RPC URL from env vars

### `src/components/QueryBuilder.tsx`

**Visual query builder UI**

- Dynamic form based on entity type selection
- Generates SQL-like preview
- Supports all filter types
- Example query buttons

### `src/app/analytics/page.tsx`

**Main analytics dashboard**

- Client component with useEffect
- Fetches all entity types in parallel
- Auto-refreshes every 30 seconds
- Displays all charts conditionally

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc

# Optional (for WebSocket subscriptions)
NEXT_PUBLIC_ARKIV_WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws
```

---

## Data Isolation Considerations

⚠️ **Important**: By default, queries return **ALL** entities matching attributes, regardless of who created them. The Mendoza testnet is a **shared public database**.

### Current Behavior

```typescript
// Gets EVERYONE's Aave events on the testnet
const events = await client
  .buildQuery()
  .where(eq("protocol", "aave-v3"))
  .fetch();
```

### For Private/Isolated Data

Add a `projectId` attribute to namespace your data:

```typescript
// When creating entities
const event = {
  entityType: "protocol_event",
  projectId: "my-unique-project-id", // ← Add this
  protocol: "aave-v3",
  // ... rest of data
};

// When querying
const events = await client
  .buildQuery()
  .where(eq("projectId", "my-unique-project-id")) // ← Filter by project
  .fetch();
```

---

## Testing & Debugging

### Check Current Data

```bash
npx tsx test-new-data.ts
```

Expected output:

```
📊 Test 1: Querying Protocol Events...
✅ Found 45 protocol events

📊 Test 2: Querying Aave V3 Events...
✅ Found 30 Aave V3 events

📊 Test 3: Querying Uniswap V3 Events...
✅ Found 15 Uniswap V3 swap events

📊 Test 4: Querying Aggregated Metrics...
✅ Found 5 aggregated metrics

📊 Test 5: Querying Price Snapshots...
✅ Found 8 price snapshots
```

### Common Issues

**Issue**: `✅ Found 0 protocol events`

**Causes**:

1. Entities expired (TTL reached)
2. Event generator not run yet
3. Wrong RPC URL

**Solution**: Re-run event generator

---

**Issue**: Query returns entities but wrong data types

**Causes**:

1. Not filtering by correct attribute
2. Payload not decoded properly

**Solution**: Check attribute keys match what generator sets

---

## Advanced Patterns

### Multi-Protocol Statistics

```typescript
export async function calculateEventStats(): Promise<EventStats> {
  const events = await queryAllEvents(1000);

  const stats: EventStats = {
    totalEvents: events.length,
    eventsByType: {},
    totalVolume: {},
    uniqueUsers: 0,
    recentEvents: events.slice(0, 10),
    protocolBreakdown: {},
  };

  const uniqueUserSet = new Set<string>();

  events.forEach((event) => {
    // Count by event type
    stats.eventsByType[event.eventType] =
      (stats.eventsByType[event.eventType] || 0) + 1;

    // Count by protocol
    const protocol = (event as any).protocol;
    if (protocol) {
      stats.protocolBreakdown![protocol] =
        (stats.protocolBreakdown![protocol] || 0) + 1;
    }

    // Track unique users (Aave user + Uniswap sender/recipient)
    const user = (event as any).user || (event as any).sender;
    if (user) uniqueUserSet.add(user);

    const recipient = (event as any).recipient;
    if (recipient) uniqueUserSet.add(recipient);

    // Calculate volumes by asset
    const reserve = (event as any).reserve;
    const amount = parseFloat(
      (event as any).amountUSD || (event as any).amount || "0"
    );

    if (reserve && !isNaN(amount)) {
      stats.totalVolume[reserve] = (stats.totalVolume[reserve] || 0) + amount;
    }
  });

  stats.uniqueUsers = uniqueUserSet.size;
  return stats;
}
```

### Conditional Chart Rendering

```typescript
// Only show charts when data is available
{
  events.length > 0 && <ProtocolComparisonChart events={events} />;
}

{
  metrics.length > 0 && <HourlyVolumeChart metrics={metrics} />;
}

{
  prices.length > 0 && <PriceHistoryChart prices={prices} />;
}
```

---

## Best Practices

1. **Always check entity expiration**: Re-generate data regularly for testing
2. **Use priority-based queries**: Put most selective filter in `.where()` clause
3. **Decode payloads properly**: Always use `TextDecoder` → `JSON.parse`
4. **Handle missing data gracefully**: Show empty states when no entities found
5. **Type guard everything**: Use type guards when working with union types
6. **Client-side filter carefully**: Remember to handle both Aave and Uniswap field names
7. **Consider data isolation**: Add `projectId` for production use

---

## Future Enhancements

- [ ] Add real-time subscriptions via WebSocket
- [ ] Implement pagination for large result sets
- [ ] Add CSV export for all charts
- [ ] Create saved queries feature
- [ ] Add user authentication and private dashboards
- [ ] Integrate with real Aave/Uniswap subgraphs for production data
- [ ] Add more protocols (Compound, Curve, etc.)
- [ ] Implement advanced analytics (TVL tracking, APY calculations)

---

## Resources

- **Arkiv Network Docs**: https://arkiv.network/docs
- **Arkiv SDK**: https://www.npmjs.com/package/@arkiv-network/sdk
- **Mendoza Explorer**: https://explorer.mendoza.hoodi.arkiv.network/
- **Next.js 15 Docs**: https://nextjs.org/docs
- **Recharts Docs**: https://recharts.org/

---

## License

This is a hackathon project for ETH Argentina 2024.
