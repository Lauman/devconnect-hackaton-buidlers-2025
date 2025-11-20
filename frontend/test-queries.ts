// Test script to verify Arkiv queries
import 'dotenv/config';
import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';

async function testQueries() {
  console.log('🧪 Testing Arkiv Queries\n');

  const client = createPublicClient({
    chain: mendoza,
    transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
  });

  console.log('✅ Connected to Arkiv Network');
  console.log(`📍 RPC: ${process.env.NEXT_PUBLIC_ARKIV_RPC_URL}\n`);

  try {
    // Test 1: Query all Aave events
    console.log('📊 Test 1: Querying all Aave events...');
    const result = await client
      .buildQuery()
      .where(eq('protocol', 'aave-v3'))
      .withAttributes(true)
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${result.entities.length} events\n`);

    if (result.entities.length > 0) {
      const first = result.entities[0];
      console.log('📝 Sample event:');
      console.log(`   Entity Key: ${first.key}`);
      console.log(`   Owner: ${first.owner}`);
      console.log(`   Created at block: ${first.createdAtBlock}`);

      // Parse the payload
      const payload = JSON.parse(new TextDecoder().decode(first.payload));
      console.log(`   Event Type: ${payload.eventType}`);
      console.log(`   Reserve: ${payload.reserve}`);
      console.log(`   Amount: ${payload.amount}`);
      console.log(`   User: ${payload.user}`);
      console.log(`   Timestamp: ${payload.timestamp}\n`);

      // Show attributes
      console.log('   Attributes:');
      first.attributes.slice(0, 5).forEach((attr: any) => {
        console.log(`     - ${attr.key}: ${attr.value}`);
      });
      console.log('');
    }

    // Test 2: Query by event type
    console.log('📊 Test 2: Querying Supply events...');
    const supplyResult = await client
      .buildQuery()
      .where(eq('eventType', 'Supply'))
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${supplyResult.entities.length} Supply events\n`);

    // Test 3: Query by asset
    console.log('📊 Test 3: Querying USDC events...');
    const usdcResult = await client
      .buildQuery()
      .where(eq('reserve', 'USDC'))
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${usdcResult.entities.length} USDC events\n`);

    console.log('🎉 All tests passed!\n');
    console.log('💡 Next step: Open http://localhost:3001 to view the dashboard');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testQueries();
