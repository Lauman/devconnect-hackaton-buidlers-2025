# Technical Architecture: Decentralized Indexing on Arkiv

## High-Level Overview

**What We Built:** A decentralized blockchain indexing platform that stores queryable event data on Arkiv's DB-chain instead of centralized databases.

**The Innovation:** Replace PostgreSQL/MongoDB with a blockchain optimized for queryable data storage.

---

## Traditional Architecture (What We're Replacing)

### Typical Blockchain Analytics Stack (Dune, The Graph, etc.)

```
┌─────────────────────────────────────────────┐
│  Ethereum Blockchain (Decentralized)        │
│  • Smart contracts emit events               │
│  • Immutable, distributed ledger             │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  Event Indexer (Centralized Service)        │
│  • Runs on AWS/GCP servers                   │
│  • Listens to blockchain events              │
│  • Can go down, be censored                  │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  Database (Centralized PostgreSQL/MongoDB)  │
│  • Stores parsed events                      │
│  • Single point of failure                   │
│  • Proprietary (can't self-host)            │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  API Layer (Centralized REST/GraphQL)       │
│  • Cloudflare CDN                            │
│  • Rate limits                               │
│  • Can censor queries                        │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  User Dashboard (Your App)                  │
│  • Dependent on entire stack above           │
│  • Fails if any layer fails                 │
└─────────────────────────────────────────────┘
```

**Problems:**
- ❌ 4 layers of centralization (indexer, DB, API, CDN)
- ❌ Each layer can go down independently
- ❌ Each layer can censor data
- ❌ Vendor lock-in (proprietary databases)
- ❌ No data ownership (platform owns your queries)

---

## Our Architecture (Decentralized)

### Arkiv-Powered Indexing Stack

```
┌─────────────────────────────────────────────┐
│  Ethereum Blockchain (Decentralized)        │
│  • Smart contracts emit events               │
│  • Source of truth                           │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  Event Listener (Open Source, Self-Hosted)  │
│  • Ethers.js event listener                  │
│  • Anyone can run (no gatekeepers)           │
│  • Resilient: if ours fails, run your own   │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  Queue System (Optional, For Reliability)   │
│  • BullMQ + Redis                            │
│  • Ensures events aren't lost               │
│  • Retry logic for failed writes            │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  Arkiv DB-Chain (Decentralized Storage)     │
│  • Events stored as entities with attributes │
│  • Queryable like a database                 │
│  • No single point of failure                │
│  • Censorship-resistant (blockchain-based)   │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  Frontend Dashboard (Direct Query)          │
│  • Queries Arkiv blockchain directly         │
│  • No intermediary API needed                │
│  • Can self-host (Next.js static export)    │
└─────────────────────────────────────────────┘
```

**Advantages:**
- ✅ Only 1 layer of centralization (event listener, but it's open source)
- ✅ Arkiv DB-chain is decentralized (no single failure point)
- ✅ No API layer needed (direct blockchain queries)
- ✅ Self-hostable at every layer
- ✅ Data ownership (on-chain, public good)

---

## Deep Dive: Component Architecture

### 1. Event Listener (Backend)

**Technology Stack:**
- Node.js / TypeScript
- Ethers.js (blockchain interaction)
- BullMQ (job queue)
- Redis (queue storage)
- Arkiv SDK (blockchain writes)

**How It Works:**

```typescript
// 1. Listen to Ethereum events
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(contractAddress, abi, provider);

contract.on("Supply", async (reserve, user, amount, event) => {
  // 2. Parse event data
  const eventData = {
    reserve,
    user,
    amount: amount.toString(),
    txHash: event.log.transactionHash,
  };

  // 3. Queue for processing (reliability)
  await queue.add("supply", eventData);
});

// 4. Worker processes queue
worker.on("job", async (job) => {
  // 5. Store on Arkiv with queryable attributes
  await arkivClient.mutateEntities({
    creates: [{
      payload: jsonToPayload(job.data), // Full event data
      attributes: [                       // Queryable metadata
        { key: "protocol", value: "aave-v3" },
        { key: "event-type", value: "Supply" },
        { key: "user", value: job.data.user },
        { key: "reserve", value: job.data.reserve },
        { key: "amount", value: job.data.amount },
      ],
      expiresIn: ExpirationTime.fromHours(24), // TTL
    }],
  });
});
```

**Key Design Decisions:**

1. **Event-Driven Architecture**
   - Listen to smart contract events (not poll blocks)
   - Lower latency, less RPC usage

2. **Queue System (BullMQ)**
   - Decouples event capture from storage
   - Retry logic (resilient to Arkiv network hiccups)
   - Rate limiting (don't overwhelm Arkiv)

3. **Attribute Mapping Strategy**
   - Store full event in payload (JSON blob)
   - Extract searchable fields as attributes
   - Balance: too many attributes = higher cost, too few = limited queries

**Scalability:**
- Current: 1 listener per protocol (Aave, Uniswap, etc.)
- Scale: Multiple listeners, same queue (horizontal scaling)
- Future: Distributed listeners (multiple teams run same listener, redundancy)

---

### 2. Arkiv DB-Chain (Storage Layer)

**What is Arkiv?**

Arkiv is a blockchain optimized for **storing and querying structured data** with attribute-based indexing.

**Key Concepts:**

#### Entity-Attribute Model

```typescript
interface ArkivEntity {
  key: string;                    // Auto-generated unique ID
  payload: Uint8Array;            // Full data (arbitrary bytes)
  contentType: string;            // MIME type (e.g., "application/json")
  attributes: Array<{             // Queryable metadata (like SQL columns)
    key: string;                  // Attribute name
    value: string;                // Attribute value (string only)
  }>;
  owner: string;                  // Wallet that created it
  createdAtBlock: number;         // Blockchain timestamp
  lastModifiedAtBlock: number;
  expiration: number;             // TTL (entities can expire!)
}
```

**Think of it as:**
- **Payload** = Row data (full JSON blob)
- **Attributes** = Indexed columns (for WHERE clauses)

**Example: Aave Supply Event**

```typescript
// What we store on Arkiv
{
  payload: {
    // Full event data (JSON encoded to Uint8Array)
    reserve: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    onBehalfOf: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    amount: "1000000000", // 1000 USDC (6 decimals)
    referralCode: "0",
    txHash: "0xabc123..."
  },
  contentType: "application/json",
  attributes: [
    // Queryable fields (enable SQL-like WHERE clauses)
    { key: "protocol", value: "aave-v3" },
    { key: "event-type", value: "Supply" },
    { key: "reserve", value: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    { key: "user", value: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1" },
    { key: "amount", value: "1000000000" },
    { key: "txHash", value: "0xabc123..." },
  ],
  expiresIn: ExpirationTime.fromHours(24), // Entity expires in 24h
}
```

**Querying:**

```typescript
// Find all Aave Supply events
const result = await arkivClient
  .buildQuery()
  .where(eq("event-type", "Supply")) // SQL-like WHERE clause
  .withPayload(true)                 // Include full JSON data
  .withAttributes(true)
  .fetch();

// Returns array of matching entities
result.entities.forEach(entity => {
  const eventData = JSON.parse(new TextDecoder().decode(entity.payload));
  console.log(eventData); // { reserve, user, amount, ... }
});
```

**Why Arkiv Over Traditional Blockchain?**

| Feature | Ethereum (EVM) | Arkiv DB-Chain |
|---------|----------------|----------------|
| **Purpose** | Smart contracts | Data storage + querying |
| **Query Support** | ❌ No (must scan all blocks) | ✅ Yes (attribute indexing) |
| **Storage Cost** | Very expensive ($50/MB) | Cheap ($0.01/MB estimate) |
| **Read Performance** | Slow (scan chain) | Fast (indexed queries) |
| **TTL Support** | ❌ No (data forever) | ✅ Yes (entities can expire) |

**Arkiv is essentially "PostgreSQL as a blockchain."**

---

### 3. Query Layer (Frontend)

**Technology Stack:**
- Next.js 15 (App Router)
- TypeScript
- Arkiv SDK (queries)
- Recharts (visualizations)

**How Queries Work:**

```typescript
// Client-side query (runs in browser)
import { getArkivPublicClient } from '@/lib/arkiv';
import { eq } from '@arkiv-network/sdk/query';

export async function queryAaveEvents() {
  const client = getArkivPublicClient(); // Connects to Arkiv RPC

  // Query Arkiv blockchain for events
  const result = await client
    .buildQuery()
    .where(eq("protocol", "aave-v3"))  // Only Aave events
    .withPayload(true)                 // Fetch full data
    .withAttributes(true)              // Include metadata
    .fetch();

  // Parse and return
  return result.entities.map(entity => {
    const text = new TextDecoder().decode(entity.payload);
    return JSON.parse(text); // Convert Uint8Array → JSON
  });
}
```

**Important Constraint: Single WHERE Clause**

⚠️ Arkiv queries currently support **only ONE** `.where()` clause.

**Workaround: Priority-Based Querying + Client-Side Filtering**

```typescript
export async function queryEventsWithFilters(filters: EventFilters) {
  // Priority 1: Use most selective filter in .where()
  let query = client.buildQuery();

  if (filters.eventType && filters.eventType !== "all") {
    // Event type is most selective
    query = query.where(eq("event-type", filters.eventType));
  } else if (filters.protocol && filters.protocol !== "all") {
    // Fallback: protocol filter
    query = query.where(eq("protocol", filters.protocol));
  } else {
    // Default: all Aave events
    query = query.where(eq("protocol", "aave-v3"));
  }

  // Fetch all matching events
  const result = await query.withPayload(true).fetch();
  let events = result.entities.map(parseEntity);

  // Priority 2: Apply remaining filters client-side
  if (filters.user) {
    events = events.filter(e => e.user === filters.user);
  }

  if (filters.minAmount) {
    events = events.filter(e => parseFloat(e.amount) >= parseFloat(filters.minAmount));
  }

  return events;
}
```

**Trade-offs:**
- ✅ Pro: Flexible querying (any combination of filters)
- ❌ Con: Some filtering happens client-side (fetch more data than needed)

**Future Optimization:** Arkiv may add support for compound WHERE clauses (AND/OR logic).

---

### 4. Dashboard & Visualization

**Tech Stack:**
- Next.js 15 (App Router, React Server Components)
- Recharts (charts)
- Tailwind CSS (styling)
- date-fns (date formatting)

**Key Components:**

**a) Stats Cards** (Overview Metrics)
```typescript
// Fetch all events, calculate stats
const events = await queryAllAaveEvents();

const stats = {
  totalEvents: events.length,
  uniqueUsers: new Set(events.map(e => e.user)).size,
  totalVolume: events.reduce((sum, e) => sum + parseFloat(e.amount), 0),
  eventsByType: countBy(events, 'eventType'),
};
```

**b) Event Distribution Chart** (Pie Chart)
```typescript
// Count events by type
const data = [
  { name: "Supply", value: 45 },
  { name: "Withdraw", value: 30 },
  { name: "FlashLoan", value: 15 },
  { name: "LiquidationCall", value: 10 },
];

<PieChart data={data} />
```

**c) Events Table** (Data Grid)
```typescript
// Display all events in table
{events.map(event => (
  <tr key={event.entityKey}>
    <td>{event.eventType}</td>
    <td>{formatAddress(event.user)}</td>
    <td>{formatAmount(event.amount, event.reserve)}</td>
    <td>{formatTimestamp(event.timestamp)}</td>
    <td><a href={`https://etherscan.io/tx/${event.txHash}`}>View</a></td>
  </tr>
))}
```

**Auto-Refresh Strategy:**

```typescript
// Refresh data every 30 seconds
useEffect(() => {
  fetchData(); // Initial load

  const interval = setInterval(() => {
    fetchData(); // Refresh
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

**Why 30 seconds?**
- Balance: Fresh data vs. Arkiv RPC load
- Ethereum blocks: ~12 seconds (2-3 blocks per refresh)
- User experience: Feels "real-time" without hammering the network

---

## Data Flow: End-to-End

### Scenario: User Supplies USDC to Aave

```
1. User interacts with Aave smart contract
   ↓
2. Aave emits "Supply" event on Ethereum blockchain
   ↓
3. Our event listener (ethers.js) detects event
   ↓
4. Event added to BullMQ queue
   {
     reserve: "0xA0b...",
     user: "0x742d...",
     amount: "1000000000",
     txHash: "0xabc..."
   }
   ↓
5. Worker picks up job from queue
   ↓
6. Worker calls Arkiv SDK to store event
   {
     payload: <full JSON>,
     attributes: [
       { key: "protocol", value: "aave-v3" },
       { key: "event-type", value: "Supply" },
       { key: "user", value: "0x742d..." },
       ...
     ]
   }
   ↓
7. Arkiv blockchain confirms write
   ↓
8. Event now stored on-chain, queryable
   ↓
9. Frontend queries Arkiv for latest events
   client.buildQuery()
     .where(eq("protocol", "aave-v3"))
     .fetch()
   ↓
10. Frontend receives entity, decodes payload
    ↓
11. User sees new Supply event in dashboard
    (within ~30 seconds of original transaction)
```

**Latency Breakdown:**
- Ethereum event emission: 12 seconds (block time)
- Event listener detection: <1 second (WebSocket)
- Queue processing: <1 second
- Arkiv write: ~10 seconds (Arkiv block time)
- Frontend refresh: 0-30 seconds (polling interval)

**Total: ~25-60 seconds from tx to dashboard**

---

## Infrastructure & DevOps

### Current Setup (Hackathon/MVP)

**Backend:**
- 1 VPS (DigitalOcean/AWS) - $20/month
- Redis (local Docker) - included
- Node.js event listener - running 24/7
- Arkiv SDK - free (just gas costs)

**Frontend:**
- Vercel deployment - free tier
- Static hosting (Next.js SSG) - $0/month
- Client-side queries (no backend needed)

**Arkiv Costs:**
- Storage: ~$0.01 per 1k events (estimate)
- Queries: Free (blockchain reads)
- Writes: Gas costs (~$0.001 per event)

**Total Monthly Cost:** ~$50/month (scales to thousands of events)

---

### Production Setup (Year 1)

**Backend (Redundancy):**
- 3 event listeners (different providers: Infura, Alchemy, own node)
- Redis cluster (AWS ElastiCache or self-hosted)
- Load balancer (distribute writes across listeners)
- Monitoring (Datadog, Grafana)

**Frontend:**
- Vercel Pro ($20/month) or self-hosted (Cloudflare Pages)
- CDN for static assets
- Edge caching (Arkiv query results, 1min TTL)

**Arkiv:**
- Multiple RPC endpoints (redundancy)
- Potential: Run own Arkiv validator node (full control)

**Total Monthly Cost:** ~$500-$1,000/month (handles millions of events)

---

## Security Considerations

### 1. Private Key Management

**Event Listener Wallet:**
- Needs private key to write to Arkiv
- Stored in env vars (not committed to git)
- Production: Use AWS Secrets Manager or HashiCorp Vault

**Risk:** Compromised key = attacker can write fake events

**Mitigation:**
- Separate keys per environment (dev, staging, prod)
- Monitor for unusual activity (alerts on high write volume)
- Entity verification (cross-check txHash against Ethereum)

---

### 2. Data Integrity

**Problem:** Anyone can write to Arkiv (permissionless)

**Question:** How do users know our data is legit?

**Solution: Verifiable Data**

```typescript
// Every entity includes txHash attribute
{ key: "txHash", value: "0xabc123..." }

// Users can verify:
1. Fetch entity from Arkiv
2. Check txHash on Etherscan
3. Confirm event matches Ethereum logs
4. Trust established (cryptographic proof)
```

**Future Enhancement: Signed Entities**
- Listener signs each entity with private key
- Users verify signature (proves data came from us)
- Multi-sig (require 2-of-3 listeners to agree)

---

### 3. Query Injection

**Problem:** User-generated queries could be malicious

**Current:** Arkiv SDK sanitizes inputs (safe)

**Our Layer:**
```typescript
// Validate user input
function validateEventType(eventType: string) {
  const allowed = ["Supply", "Withdraw", "FlashLoan", "LiquidationCall"];
  if (!allowed.includes(eventType)) {
    throw new Error("Invalid event type");
  }
  return eventType;
}

// Use validated input
const result = await client
  .buildQuery()
  .where(eq("event-type", validateEventType(userInput)))
  .fetch();
```

---

### 4. Rate Limiting & DoS

**Problem:** Malicious user spams Arkiv with writes

**Mitigation:**
1. **Queue Rate Limiting** (BullMQ)
   - Max 100 jobs/second (configurable)
   - Prevents listener from overwhelming Arkiv

2. **Write Throttling**
   - Only write events from known smart contracts
   - Verify txHash before writing (skip fake events)

3. **Cost as a Defense**
   - Arkiv writes cost gas (economic disincentive to spam)
   - Attacker would burn money to pollute data

---

## Scalability

### Current Limitations

**Arkiv Constraints:**
- Block time: ~10 seconds (slower than Ethereum's 12s)
- Single WHERE clause (limits query flexibility)
- Entities expire (TTL model, not permanent storage)

**Our Constraints:**
- Client-side filtering (fetches more data than needed)
- 30-second refresh (not real-time)
- Single event listener (SPOF)

---

### Scaling Plan (Year 1-2)

**Phase 1: Horizontal Event Listeners**
```
Ethereum → Listener 1 (Infura RPC)  ↘
        → Listener 2 (Alchemy RPC)  → Queue → Arkiv
        → Listener 3 (Own Node)     ↗
```
- 3 listeners for redundancy
- If one fails, others continue
- Deduplication in queue (prevent duplicate writes)

---

**Phase 2: Query Caching Layer**
```
Frontend → Cache (Redis, 1min TTL) → Arkiv
```
- Cache frequently accessed queries
- Reduce load on Arkiv RPC
- Faster response times for users

**Cache Key Strategy:**
```typescript
const cacheKey = `aave:${protocol}:${eventType}:${limit}`;
const cached = await redis.get(cacheKey);

if (cached) return JSON.parse(cached);

// Miss: fetch from Arkiv
const result = await arkivClient.buildQuery()...fetch();

// Store in cache (1min TTL)
await redis.setex(cacheKey, 60, JSON.stringify(result));
return result;
```

---

**Phase 3: Multi-Chain Support**
```
Ethereum → Listener → Arkiv (with "chain" attribute)
Polygon  → Listener → Arkiv (with "chain" attribute)
Arbitrum → Listener → Arkiv (with "chain" attribute)
```

**Unified Query:**
```typescript
// Query events from all chains
const result = await client
  .buildQuery()
  .where(eq("protocol", "aave-v3")) // All Aave, any chain
  .fetch();

// Or filter by chain client-side
const ethereumEvents = result.entities.filter(e => e.chain === "ethereum");
```

---

**Phase 4: Distributed Indexing (Community-Run)**
```
Team A → Listener → Arkiv (writes Aave events)
Team B → Listener → Arkiv (writes Uniswap events)
Team C → Listener → Arkiv (writes Compound events)
```

**Open Source = Decentralized Indexing:**
- Anyone can run a listener
- Multiple teams index same protocol (redundancy)
- Data aggregates on Arkiv (single source of truth)

---

## Future Enhancements

### 1. Real-Time Subscriptions

**Current:** Poll every 30 seconds (inefficient)

**Future:** WebSocket subscriptions

```typescript
// Subscribe to new events in real-time
arkivClient.subscribe({
  where: eq("protocol", "aave-v3"),
  onData: (entity) => {
    console.log("New event!", entity);
    // Update dashboard in real-time
  }
});
```

**Implementation:** Arkiv SDK supports WebSockets (not yet used)

---

### 2. Complex Queries (AND/OR Logic)

**Current:** Single WHERE clause

**Future:** Compound conditions

```typescript
// Query Aave Supply events for USDC above $10k
const result = await client
  .buildQuery()
  .where(
    and(
      eq("event-type", "Supply"),
      eq("reserve", "0xA0b..."), // USDC address
      gt("amount", "10000000000") // >$10k
    )
  )
  .fetch();
```

**Blocker:** Arkiv SDK doesn't support this yet
**Workaround:** Client-side filtering (current approach)

---

### 3. Historical Data Backfills

**Current:** Only index events from "now" onward

**Future:** Backfill historical events

```typescript
// Scan Ethereum from block 11362579 (Aave V3 deployment) to now
for (let block = 11362579; block <= currentBlock; block += 1000) {
  const events = await contract.queryFilter("Supply", block, block + 1000);
  events.forEach(event => queueEvent(event));
}
```

**Challenge:** Expensive (RPC costs, time)
**Solution:** One-time migration, then maintain real-time

---

### 4. Multi-Signature Verification

**Problem:** Users must trust our listener wrote correct data

**Solution:** Multi-sig validation

```
Listener 1 → Writes event → Signs with key 1
Listener 2 → Writes same event → Signs with key 2
Listener 3 → Writes same event → Signs with key 3

On Arkiv:
- Entity has 3 signatures
- Users verify: "2-of-3 listeners agree on this event"
- Trustless verification
```

**Implementation:** Requires custom attribute for signatures

---

## Open Questions & Research

### 1. Arkiv Long-Term Storage

**Question:** Entities expire (TTL). How do we store data "forever"?

**Options:**
a) Periodically refresh entities (reset TTL before expiration)
b) Migrate old data to Arweave/Filecoin (permanent storage)
c) Arkiv adds "permanent entities" feature (pay more for no expiration)

**Current:** Accept TTL model (24 hours), re-run listener if data lost

---

### 2. Query Performance at Scale

**Question:** How fast are Arkiv queries with 1M+ entities?

**Concerns:**
- Attribute indexing performance
- Network latency (blockchain queries slower than DB)

**Testing Needed:**
- Benchmark: 10k, 100k, 1M entities
- Optimize: Add more attributes? Fewer attributes?
- Fallback: Cache layer (Redis) for hot queries

---

### 3. Cost Model

**Question:** What's the real cost per event at scale?

**Variables:**
- Arkiv storage cost (unknown, still in beta)
- Gas costs for writes (depends on Arkiv tokenomics)
- RPC costs (Ethereum event listening)

**Estimate:**
- Ethereum RPC: ~$50/month (Alchemy free tier)
- Arkiv writes: ~$0.001 per event (gas estimate)
- 1M events/month: ~$1,000 in Arkiv gas

**Competitive:**
- AWS RDS (PostgreSQL): $500-$2,000/month for 1M events
- The Graph subgraph: $100-$500/month (GRT tokens)

**Our model is competitive, potentially cheaper at scale.**

---

## Technology Decisions & Trade-offs

### Why Arkiv Over Other Decentralized Storage?

| Storage Layer | Why Not? | Why Arkiv? |
|---------------|----------|-----------|
| **IPFS** | Not queryable (need CID, can't search) | Arkiv has attribute queries |
| **Arweave** | Permanent (expensive), not queryable | Arkiv is cheaper, queryable |
| **Filecoin** | Designed for large files, not small events | Arkiv optimized for structured data |
| **Ceramic** | Good for documents, weak on queries | Arkiv built for SQL-like queries |
| **Ethereum** | Too expensive ($50/MB) | Arkiv is cheap (~$0.01/MB) |

**Arkiv is the only decentralized storage optimized for queryable analytics data.**

---

### Why Next.js Over Traditional SPA?

| Approach | Why Not? | Why Next.js? |
|----------|----------|--------------|
| **Create React App** | No SSR, poor SEO | Next.js has SSG/SSR |
| **Vite + React** | Build complexity, no routing | Next.js is batteries-included |
| **Plain HTML/JS** | No React benefits, hard to scale | Next.js is React + DX |

**Next.js gives us:**
- ✅ React ecosystem
- ✅ File-based routing
- ✅ Static export (can host anywhere)
- ✅ TypeScript support
- ✅ Fast refresh (DX)

---

### Why Ethers.js Over Web3.js?

| Library | Pros | Cons | Our Choice |
|---------|------|------|------------|
| **Ethers.js** | Lightweight, modern API, TypeScript | Smaller ecosystem | ✅ Use this |
| **Web3.js** | Older, more examples online | Bloated, callback hell | ❌ Skip |
| **Viem** | New, performant, TypeScript-first | Less mature | 🤔 Consider for v2 |

**Ethers.js is the sweet spot: modern, stable, TypeScript-friendly.**

---

## Deployment

### Backend Deployment (Event Listener)

**Option 1: VPS (DigitalOcean, AWS EC2)**
```bash
# SSH into server
ssh user@server-ip

# Clone repo
git clone https://github.com/your-repo.git
cd backend

# Install dependencies
npm install

# Set env vars
export ETHEREUM_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
export ARKIV_PRIVATE_KEY="0x..."
export REDIS_HOST="127.0.0.1"

# Start Redis
docker run -d -p 6379:6379 redis

# Start services
npm run dev:services
```

**Option 2: Docker Compose**
```yaml
version: '3.8'
services:
  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  listener:
    build: .
    environment:
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
      - ARKIV_PRIVATE_KEY=${ARKIV_PRIVATE_KEY}
    depends_on:
      - redis
    command: npm run start:listeners

  worker:
    build: .
    environment:
      - ARKIV_PRIVATE_KEY=${ARKIV_PRIVATE_KEY}
    depends_on:
      - redis
    command: npm run start:worker
```

**Run:**
```bash
docker-compose up -d
```

---

### Frontend Deployment (Dashboard)

**Option 1: Vercel (Easiest)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**Option 2: Static Export (Self-Host)**
```bash
# Build static site
npm run build
npm run export

# Output: /out directory
# Host anywhere: GitHub Pages, Cloudflare Pages, AWS S3, Netlify
```

**Option 3: Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## Monitoring & Observability

### Key Metrics to Track

**Backend (Event Listener):**
- Events processed per minute
- Queue depth (how many pending jobs)
- Arkiv write success rate
- Failed jobs (retry count)
- Listener uptime

**Frontend:**
- Query response time (Arkiv RPC)
- Dashboard load time
- Cache hit rate (if caching)
- Active users

**Arkiv:**
- Total entities stored
- Storage cost (gas spent)
- Query latency

---

### Monitoring Stack

**Option 1: Simple (Start Here)**
- Logs: Console + file (Winston, Pino)
- Alerts: Uptime monitor (UptimeRobot, BetterStack)
- Metrics: Manual (check logs daily)

**Option 2: Production (Year 1)**
- Logs: Datadog, Loggly, Papertrail
- Metrics: Prometheus + Grafana
- Alerts: PagerDuty, Opsgenie
- APM: New Relic, Datadog APM

---

## Conclusion

**We've built a fully functional proof-of-concept that demonstrates:**

1. ✅ Blockchain events can be indexed and stored on a decentralized DB-chain
2. ✅ Querying on-chain data is feasible (not just theory)
3. ✅ Dashboards can be built without centralized APIs
4. ✅ The stack is simple enough to scale (no exotic tech)

**What's Next:**

**Short-term (3 months):**
- [ ] Production-ready backend (monitoring, error handling)
- [ ] Multi-protocol support (Uniswap, Compound)
- [ ] Query caching layer (Redis)
- [ ] Historical data backfill

**Medium-term (6-12 months):**
- [ ] Multi-chain support (Polygon, Arbitrum, Base)
- [ ] Real-time subscriptions (WebSocket)
- [ ] Community-run listeners (decentralized indexing)
- [ ] Advanced query features (AND/OR, aggregations)

**Long-term (1-2 years):**
- [ ] Multi-sig verification (trustless data)
- [ ] Permanent storage option (Arweave integration)
- [ ] Self-service indexing (users deploy their own listeners)
- [ ] Data marketplace (protocols pay to be indexed)

**The architecture is sound. The technology works. Now it's about execution.**
