const { initializeDatabase, getDatabase } = require('./db');
const { ddb } = require('./dynamoClient');
const { BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} = require('@aws-sdk/client-dynamodb');

const TABLE = process.env.DYNAMO_TABLE_NAME || 'Repairs';

async function ensureRepairsTableExists() {
  try {
    await ddb.send(new DescribeTableCommand({ TableName: TABLE }));
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      await ddb.send(
        new CreateTableCommand({
          TableName: TABLE,
          AttributeDefinitions: [
            { AttributeName: 'repair_id', AttributeType: 'S' },
          ],
          KeySchema: [{ AttributeName: 'repair_id', KeyType: 'HASH' }],
          BillingMode: 'PAY_PER_REQUEST',
        })
      );
      await waitUntilTableExists(
        { client: ddb },
        { TableName: TABLE, maxWaitTime: 120 }
      );
    } else {
      throw error;
    }
  }
}

async function extractRepairsFromSqlite() {
  await initializeDatabase();
  const db = getDatabase();
  const results = db.exec(
    'SELECT repair_id, equipment_type, service_category, base_price, service_hours, availability, description, notes, created_at, updated_at FROM repairs'
  );
  if (!results || results.length === 0) {
    return [];
  }

  const columns = results[0].columns;
  return results[0].values.map((row) => {
    const item = {};
    columns.forEach((col, idx) => {
      item[col] = row[idx];
    });
    return item;
  });
}

async function batchWrite(items) {
  const requestItems = items.map((item) => ({
    PutRequest: {
      Item: {
        repair_id: item.repair_id,
        equipment_type: item.equipment_type || '',
        service_category: item.service_category || '',
        base_price: Number(item.base_price) || 0,
        service_hours: Number(item.service_hours) || 0,
        availability: item.availability || '',
        description: item.description || '',
        notes: item.notes || '',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      },
    },
  }));

  const command = new BatchWriteCommand({
    RequestItems: {
      [TABLE]: requestItems,
    },
  });

  await ddb.send(command);
}

(async () => {
  try {
    await ensureRepairsTableExists();
    const rows = await extractRepairsFromSqlite();
    if (rows.length === 0) {
      console.log('No rows found in SQLite repairs table.');
      return;
    }

    console.log(
      `Migrating ${rows.length} rows from SQLite to DynamoDB table ${TABLE}`
    );
    const chunks = [];
    for (let i = 0; i < rows.length; i += 25) {
      chunks.push(rows.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await batchWrite(chunk);
      console.log(`Migrated ${chunk.length} items...`);
    }

    console.log('Migration complete.');
  } catch (error) {
    if (error && error.name === 'ResourceNotFoundException') {
      console.error(`Migration failed: DynamoDB table "${TABLE}" not found.`);
      console.error(
        'Verify DYNAMO_TABLE_NAME, AWS_REGION, and that the table exists in the target AWS account.'
      );
    } else {
      console.error('Migration failed:', error);
    }
    process.exit(1);
  }
})();
