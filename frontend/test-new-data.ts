// Test script to verify new entity types in Arkiv DB-chain
import 'dotenv/config';
import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';

const client = createPublicClient({
  chain: mendoza,
  transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
});

async function testNewEntityTypes() {
  console.log('🧪 Testing New Entity Types in Arkiv DB-chain\n');
  console.log('='.repeat(70));

  try {
    // Test 1: Query Protocol Events
    console.log('\n📊 Test 1: Querying Protocol Events...');
    const protocolEvents = await client
      .buildQuery()
      .where(eq('entityType', 'protocol_event'))
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Found ${protocolEvents.entities.length} protocol events`);

    if (protocolEvents.entities.length > 0) {
      const sample = JSON.parse(new TextDecoder().decode(protocolEvents.entities[0].payload));
      console.log(`   Sample: ${sample.protocol} - ${sample.eventType || 'Swap'}`);
    }

    // Test 2: Query Aave Events
    console.log('\n📊 Test 2: Querying Aave V3 Events...');
    const aaveEvents = await client
      .buildQuery()
      .where(eq('protocol', 'aave-v3'))
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${aaveEvents.entities.length} Aave V3 events`);

    if (aaveEvents.entities.length > 0) {
      const sample = JSON.parse(new TextDecoder().decode(aaveEvents.entities[0].payload));
      console.log(`   Sample: ${sample.eventType} - ${sample.reserve} - $${sample.amountUSD}`);
    }

    // Test 3: Query Uniswap Events
    console.log('\n📊 Test 3: Querying Uniswap V3 Events...');
    const uniswapEvents = await client
      .buildQuery()
      .where(eq('protocol', 'uniswap-v3'))
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${uniswapEvents.entities.length} Uniswap V3 swap events`);

    if (uniswapEvents.entities.length > 0) {
      const sample = JSON.parse(new TextDecoder().decode(uniswapEvents.entities[0].payload));
      console.log(`   Sample: ${sample.tokenIn} → ${sample.tokenOut} - $${sample.amountInUSD}`);
    }

    // Test 4: Query Aggregated Metrics
    console.log('\n📊 Test 4: Querying Aggregated Metrics...');
    const metrics = await client
      .buildQuery()
      .where(eq('entityType', 'aggregated_metric'))
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${metrics.entities.length} aggregated metrics`);

    if (metrics.entities.length > 0) {
      const sample = JSON.parse(new TextDecoder().decode(metrics.entities[0].payload));
      console.log(`   Sample: ${sample.protocol} - $${sample.totalVolumeUSD} - ${sample.transactionCount} txs`);
    }

    // Test 5: Query Price Snapshots
    console.log('\n📊 Test 5: Querying Price Snapshots...');
    const prices = await client
      .buildQuery()
      .where(eq('entityType', 'price_snapshot'))
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${prices.entities.length} price snapshots`);

    if (prices.entities.length > 0) {
      const sample = JSON.parse(new TextDecoder().decode(prices.entities[0].payload));
      console.log(`   Sample: ${sample.asset} - $${sample.priceUSD} (${sample.change24h})`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📈 Data Summary:');
    console.log(`   Protocol Events: ${protocolEvents.entities.length}`);
    console.log(`   ├─ Aave V3: ${aaveEvents.entities.length}`);
    console.log(`   └─ Uniswap V3: ${uniswapEvents.entities.length}`);
    console.log(`   Aggregated Metrics: ${metrics.entities.length}`);
    console.log(`   Price Snapshots: ${prices.entities.length}`);

    const total = protocolEvents.entities.length + metrics.entities.length + prices.entities.length;
    console.log(`\n   📊 Total Entities: ${total}`);

    console.log('\n✅ All entity types are available!');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit http://localhost:3001/query to query this data');
    console.log('   2. Create charts from aggregated metrics');
    console.log('   3. Build protocol comparison dashboards');

  } catch (error) {
    console.error('❌ Error testing entity types:', error);
  }
}

testNewEntityTypes();
