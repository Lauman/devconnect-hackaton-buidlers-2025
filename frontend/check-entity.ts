import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';

async function checkSpecificEntity() {
  const client = createPublicClient({
    chain: mendoza,
    transport: http('https://mendoza.hoodi.arkiv.network/rpc'),
  });

  const entityKey = '0x02cbae63101535a823a72dce83d7e6ed8cf32224721a877f4ef036402103a11a';

  console.log('\n🔍 Fetching specific entity...\n');
  console.log('Entity Key:', entityKey);

  try {
    // Get the specific entity
    const entity = await client.getEntity(entityKey as `0x${string}`);

    if (!entity) {
      console.log('❌ Entity not found');
      return;
    }

    console.log('\n✅ Entity found!\n');
    console.log('Owner:', entity.owner);
    console.log('Created at block:', entity.createdAtBlock);
    console.log('Last modified at block:', entity.lastModifiedAtBlock);
    console.log('Content Type:', entity.contentType);

    console.log('\n📋 Attributes:');
    if (entity.attributes && entity.attributes.length > 0) {
      entity.attributes.forEach((attr: any) => {
        console.log(`  ${attr.key} = ${attr.value}`);
      });
    } else {
      console.log('  No attributes found');
    }

    console.log('\n📦 Payload:');
    try {
      const text = new TextDecoder().decode(entity.payload);
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Could not decode payload:', e);
    }

    // Now test if we can query by the attributes we see
    console.log('\n🧪 Testing queries with these attributes...\n');

    if (entity.attributes && entity.attributes.length > 0) {
      for (const attr of entity.attributes.slice(0, 3)) {
        try {
          const result = await client
            .buildQuery()
            .where({ key: attr.key, value: attr.value, op: 'eq' } as any)
            .withPayload(true)
            .fetch();

          console.log(`✅ Query with ${attr.key}="${attr.value}" found ${result.entities.length} entities`);
        } catch (error: any) {
          console.log(`❌ Query with ${attr.key}="${attr.value}" failed:`, error.message);
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkSpecificEntity().catch(console.error);
