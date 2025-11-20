import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';

async function testDirectQuery() {
  const client = createPublicClient({
    chain: mendoza,
    transport: http('https://mendoza.hoodi.arkiv.network/rpc'),
  });

  console.log('\n🔍 Testing direct Arkiv queries...\n');

  // Test 1: Get ALL entities (no filter)
  console.log('📊 Test 1: Fetching ALL entities (no filter)...');
  try {
    const allEntities = await client
      .buildQuery()
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Total entities found: ${allEntities.entities.length}`);

    if (allEntities.entities.length > 0) {
      console.log('\n🔍 Inspecting first entity:');
      const first = allEntities.entities[0];

      console.log('Owner:', first.owner);
      console.log('Created at block:', first.createdAtBlock);
      console.log('Expiration:', first.expiration);

      console.log('\n📋 Attributes:');
      first.attributes?.forEach((attr: any) => {
        console.log(`  ${attr.key} = ${attr.value}`);
      });

      console.log('\n📦 Payload:');
      try {
        const text = new TextDecoder().decode(first.payload);
        const data = JSON.parse(text);
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not decode payload');
      }

      // Show all unique attribute keys
      console.log('\n🔑 All unique attribute keys across all entities:');
      const allKeys = new Set<string>();
      allEntities.entities.forEach((entity: any) => {
        entity.attributes?.forEach((attr: any) => {
          allKeys.add(attr.key);
        });
      });
      Array.from(allKeys).sort().forEach(key => console.log(`  - ${key}`));
    } else {
      console.log('❌ No entities found at all!');
      console.log('This might mean:');
      console.log('  1. Data has expired (check TTL)');
      console.log('  2. Wrong RPC endpoint');
      console.log('  3. Backend not pushing data correctly');
    }
  } catch (error: any) {
    console.error('❌ Error fetching all entities:', error.message);
  }

  // Test 2: Try to query by common attribute patterns
  console.log('\n📊 Test 2: Testing common attribute patterns...');

  const testQueries = [
    { key: 'protocol', value: 'aave-v3' },
    { key: 'Protocol', value: 'aave-v3' },
    { key: 'event-type', value: 'withdraw' },
    { key: 'eventType', value: 'withdraw' },
    { key: 'event_type', value: 'withdraw' },
    { key: 'type', value: 'withdraw' },
  ];

  for (const query of testQueries) {
    try {
      const result = await client
        .buildQuery()
        .where({ key: query.key, value: query.value, op: 'eq' } as any)
        .withPayload(true)
        .fetch();

      if (result.entities.length > 0) {
        console.log(`✅ Found ${result.entities.length} entities with ${query.key}="${query.value}"`);
      }
    } catch (error) {
      // Silently continue
    }
  }

  console.log('\n');
}

testDirectQuery().catch(console.error);
