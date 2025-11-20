// Advanced Query Examples for Arkiv DB-Chain
import 'dotenv/config';
import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq, and, or, gt, lt, gte, lte } from '@arkiv-network/sdk/query';

const client = createPublicClient({
  chain: mendoza,
  transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
});

// ==========================================
// BASIC QUERIES
// ==========================================

// 1. Query all events for a specific protocol
async function queryByProtocol() {
  console.log('\n📊 Query 1: All Aave events');
  const result = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  console.log(`Found ${result.entities.length} events`);
  return result.entities;
}

// 2. Query by event type
async function queryByEventType(eventType: string) {
  console.log(`\n📊 Query 2: ${eventType} events`);
  const result = await client
    .buildQuery()
    .where(eq('eventType', eventType))
    .withPayload(true)
    .fetch();

  console.log(`Found ${result.entities.length} ${eventType} events`);
  return result.entities;
}

// 3. Query by asset/reserve
async function queryByAsset(asset: string) {
  console.log(`\n📊 Query 3: ${asset} events`);
  const result = await client
    .buildQuery()
    .where(eq('reserve', asset))
    .withPayload(true)
    .fetch();

  console.log(`Found ${result.entities.length} ${asset} events`);
  return result.entities;
}

// 4. Query by user address
async function queryByUser(userAddress: string) {
  console.log(`\n📊 Query 4: Events for user ${userAddress.slice(0, 10)}...`);
  const result = await client
    .buildQuery()
    .where(eq('user', userAddress))
    .withPayload(true)
    .fetch();

  console.log(`Found ${result.entities.length} events for this user`);
  return result.entities;
}

// ==========================================
// COMPOUND QUERIES (Multiple Conditions)
// ==========================================

// 5. Query for Supply events of a specific asset
async function querySupplyByAsset(asset: string) {
  console.log(`\n📊 Query 5: ${asset} Supply events`);

  // Note: Arkiv compound queries work with AND logic
  // We need to filter client-side for now or make separate queries
  const allSupply = await client
    .buildQuery()
    .where(eq('eventType', 'Supply'))
    .withPayload(true)
    .withAttributes(true)
    .fetch();

  const filtered = allSupply.entities.filter(entity => {
    const reserveAttr = entity.attributes?.find(a => a.key === 'reserve');
    return reserveAttr?.value === asset;
  });

  console.log(`Found ${filtered.length} ${asset} Supply events`);
  return filtered;
}

// 6. Query for high-value transactions
async function queryHighValueTransactions(minAmount: number) {
  console.log(`\n📊 Query 6: Transactions >= ${minAmount}`);

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const filtered = allEvents.entities.filter(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    return parseFloat(payload.amount) >= minAmount;
  });

  console.log(`Found ${filtered.length} high-value transactions`);
  return filtered;
}

// 7. Query for specific user's activity with a specific asset
async function queryUserAssetActivity(userAddress: string, asset: string) {
  console.log(`\n📊 Query 7: ${userAddress.slice(0, 10)}... activity with ${asset}`);

  const userEvents = await client
    .buildQuery()
    .where(eq('user', userAddress))
    .withPayload(true)
    .withAttributes(true)
    .fetch();

  const filtered = userEvents.entities.filter(entity => {
    const reserveAttr = entity.attributes?.find(a => a.key === 'reserve');
    return reserveAttr?.value === asset;
  });

  console.log(`Found ${filtered.length} events`);
  return filtered;
}

// ==========================================
// ANALYTICS QUERIES
// ==========================================

// 8. Calculate total volume by asset
async function calculateVolumeByAsset() {
  console.log('\n📊 Query 8: Total volume by asset');

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const volumeByAsset: Record<string, number> = {};

  allEvents.entities.forEach(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    const asset = payload.reserve;
    const amount = parseFloat(payload.amount);

    if (!volumeByAsset[asset]) {
      volumeByAsset[asset] = 0;
    }
    volumeByAsset[asset] += amount;
  });

  console.log('Volume by asset:');
  Object.entries(volumeByAsset).forEach(([asset, volume]) => {
    console.log(`  ${asset}: ${volume.toLocaleString()}`);
  });

  return volumeByAsset;
}

// 9. Find most active users
async function findMostActiveUsers(topN: number = 5) {
  console.log(`\n📊 Query 9: Top ${topN} most active users`);

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const userActivity: Record<string, number> = {};

  allEvents.entities.forEach(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    const user = payload.user;

    if (!userActivity[user]) {
      userActivity[user] = 0;
    }
    userActivity[user]++;
  });

  const sorted = Object.entries(userActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  console.log('Most active users:');
  sorted.forEach(([user, count], index) => {
    console.log(`  ${index + 1}. ${user.slice(0, 10)}... - ${count} transactions`);
  });

  return sorted;
}

// 10. Analyze event distribution
async function analyzeEventDistribution() {
  console.log('\n📊 Query 10: Event type distribution');

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const distribution: Record<string, number> = {};

  allEvents.entities.forEach(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    const eventType = payload.eventType;

    if (!distribution[eventType]) {
      distribution[eventType] = 0;
    }
    distribution[eventType]++;
  });

  const total = allEvents.entities.length;

  console.log('Event distribution:');
  Object.entries(distribution).forEach(([type, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    console.log(`  ${type}: ${count} (${percentage}%)`);
  });

  return distribution;
}

// 11. Find liquidation events
async function findLiquidations() {
  console.log('\n📊 Query 11: Liquidation events');

  const result = await client
    .buildQuery()
    .where(eq('eventType', 'LiquidationCall'))
    .withPayload(true)
    .fetch();

  console.log(`Found ${result.entities.length} liquidations`);

  result.entities.forEach((entity, index) => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    console.log(`  ${index + 1}. User: ${payload.user.slice(0, 10)}... | Debt: ${payload.debtToCover} | Collateral: ${payload.liquidatedCollateralAmount}`);
  });

  return result.entities;
}

// 12. Query events within a time range (client-side filtering)
async function queryByTimeRange(startTime: Date, endTime: Date) {
  console.log(`\n📊 Query 12: Events between ${startTime.toISOString()} and ${endTime.toISOString()}`);

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const filtered = allEvents.entities.filter(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    const eventTime = new Date(payload.timestamp);
    return eventTime >= startTime && eventTime <= endTime;
  });

  console.log(`Found ${filtered.length} events in time range`);
  return filtered;
}

// ==========================================
// ADVANCED ANALYTICS
// ==========================================

// 13. Calculate average transaction size by event type
async function calculateAverageSizeByType() {
  console.log('\n📊 Query 13: Average transaction size by type');

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  allEvents.entities.forEach(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    const eventType = payload.eventType;
    const amount = parseFloat(payload.amount);

    if (!sums[eventType]) {
      sums[eventType] = 0;
      counts[eventType] = 0;
    }

    sums[eventType] += amount;
    counts[eventType]++;
  });

  console.log('Average transaction size:');
  Object.keys(sums).forEach(eventType => {
    const avg = sums[eventType] / counts[eventType];
    console.log(`  ${eventType}: ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  });

  return { sums, counts };
}

// 14. Find all unique users
async function findUniqueUsers() {
  console.log('\n📊 Query 14: Unique users');

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const users = new Set<string>();

  allEvents.entities.forEach(entity => {
    const payload = JSON.parse(new TextDecoder().decode(entity.payload));
    users.add(payload.user);
  });

  console.log(`Found ${users.size} unique users`);
  console.log('Users:');
  Array.from(users).slice(0, 10).forEach((user, index) => {
    console.log(`  ${index + 1}. ${user}`);
  });

  return Array.from(users);
}

// 15. Query with pagination
async function queryWithPagination(pageSize: number, pageNumber: number) {
  console.log(`\n📊 Query 15: Page ${pageNumber} (${pageSize} items per page)`);

  const allEvents = await client
    .buildQuery()
    .where(eq('protocol', 'aave-v3'))
    .withPayload(true)
    .fetch();

  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const page = allEvents.entities.slice(startIndex, endIndex);

  console.log(`Showing ${page.length} events (${startIndex + 1}-${startIndex + page.length} of ${allEvents.entities.length})`);

  return {
    data: page,
    total: allEvents.entities.length,
    page: pageNumber,
    pageSize,
    totalPages: Math.ceil(allEvents.entities.length / pageSize),
  };
}

// ==========================================
// RUN EXAMPLES
// ==========================================

async function runExamples() {
  console.log('🚀 Arkiv Advanced Queries Demo\n');
  console.log('='.repeat(50));

  try {
    // Basic queries
    await queryByProtocol();
    await queryByEventType('Supply');
    await queryByAsset('USDC');
    await queryByUser('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1');

    // Compound queries
    await querySupplyByAsset('WETH');
    await queryHighValueTransactions(50000);
    await queryUserAssetActivity('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 'DAI');

    // Analytics
    await calculateVolumeByAsset();
    await findMostActiveUsers(5);
    await analyzeEventDistribution();
    await findLiquidations();

    // Time-based
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    await queryByTimeRange(oneHourAgo, now);

    // Advanced analytics
    await calculateAverageSizeByType();
    await findUniqueUsers();
    await queryWithPagination(10, 1);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All queries completed successfully!');
    console.log('\n💡 You can now use these patterns in your frontend components');

  } catch (error) {
    console.error('❌ Error running queries:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runExamples();
}

// Export all query functions
export {
  queryByProtocol,
  queryByEventType,
  queryByAsset,
  queryByUser,
  querySupplyByAsset,
  queryHighValueTransactions,
  queryUserAssetActivity,
  calculateVolumeByAsset,
  findMostActiveUsers,
  analyzeEventDistribution,
  findLiquidations,
  queryByTimeRange,
  calculateAverageSizeByType,
  findUniqueUsers,
  queryWithPagination,
};
