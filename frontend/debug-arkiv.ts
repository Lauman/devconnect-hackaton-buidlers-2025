import { getArkivPublicClient } from './src/lib/arkiv';
import { eq } from '@arkiv-network/sdk/query';

async function debugArkiv() {
  const client = getArkivPublicClient();

  console.log('\n🔍 Debug: Querying Arkiv for data...\n');

  // Test 1: Query by protocol
  console.log('📊 Test 1: Query by protocol="aave-v3"');
  try {
    const result1 = await client
      .buildQuery()
      .where(eq('protocol', 'aave-v3'))
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Found ${result1.entities.length} entities with protocol="aave-v3"`);

    if (result1.entities.length > 0) {
      const first = result1.entities[0];
      console.log('\nFirst entity attributes:');
      first.attributes.forEach((attr: any) => {
        console.log(`  - ${attr.key}: ${attr.value}`);
      });

      console.log('\nFirst entity payload preview:');
      const text = new TextDecoder().decode(first.payload);
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 2: Query by event-type
  console.log('\n📊 Test 2: Query by event-type="withdraw"');
  try {
    const result2 = await client
      .buildQuery()
      .where(eq('event-type', 'withdraw'))
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Found ${result2.entities.length} entities with event-type="withdraw"`);
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 3: Query by event-type="supply"
  console.log('\n📊 Test 3: Query by event-type="supply"');
  try {
    const result3 = await client
      .buildQuery()
      .where(eq('event-type', 'supply'))
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Found ${result3.entities.length} entities with event-type="supply"`);
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 4: Query all entities owned by the address
  console.log('\n📊 Test 4: Query by owner address');
  try {
    const result4 = await client
      .buildQuery()
      .where(eq('owner', '0x5e881d665f7B139C324Aa7dC1DA759CF747e036c'))
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Found ${result4.entities.length} entities owned by this address`);

    if (result4.entities.length > 0) {
      console.log('\nAll unique attribute keys found:');
      const allKeys = new Set<string>();
      result4.entities.forEach((entity: any) => {
        entity.attributes.forEach((attr: any) => {
          allKeys.add(attr.key);
        });
      });
      Array.from(allKeys).sort().forEach(key => {
        console.log(`  - ${key}`);
      });

      console.log('\nSample entity attributes:');
      result4.entities[0].attributes.forEach((attr: any) => {
        console.log(`  ${attr.key} = ${attr.value}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 5: Try without any where clause (get latest entities)
  console.log('\n📊 Test 5: Get latest entities (no filter)');
  try {
    const result5 = await client
      .buildQuery()
      .withPayload(true)
      .withAttributes(true)
      .fetch();

    console.log(`✅ Found ${result5.entities.length} total entities`);

    if (result5.entities.length > 0) {
      console.log('\nFirst 3 entities:');
      result5.entities.slice(0, 3).forEach((entity: any, i: number) => {
        console.log(`\nEntity ${i + 1}:`);
        console.log('  Attributes:', entity.attributes.map((a: any) => `${a.key}=${a.value}`).join(', '));
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugArkiv().catch(console.error);
