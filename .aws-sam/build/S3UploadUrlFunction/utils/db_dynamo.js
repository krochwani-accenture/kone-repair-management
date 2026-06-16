const { ddb } = require('../dynamoClient');
const {
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.DYNAMO_TABLE_NAME || 'Repairs';


async function saveRepairsToDatabase(repairs) {
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const r of repairs) {
    try {
      if (!r['Repair ID']) {
        skipped++;
        errors.push('Missing Repair ID');
        continue;
      }

      const item = {
        repair_id: r['Repair ID'],
        equipment_type: r['Equipment Type'] || '',
        service_category: r['Service Category'] || '',
        base_price: Number(r['Base Price']) || 0,
        service_hours: Number(r['Service Hours']) || 0,
        availability: r['Availability'] || '',
        description: r['Description'] || '',
        notes: r['Notes'] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: item,
          ConditionExpression: 'attribute_not_exists(repair_id)'
        })
      );

      inserted++;
    } catch (err) {

      if (err && err.name === 'ConditionalCheckFailedException') {
        skipped++;
        continue;
      }

      errors.push(err.message || String(err));
    }
  }

  return { inserted, skipped, errors };
}

async function getAllRepairs() {
  const resp = await ddb.send(new ScanCommand({ TableName: TABLE }));
  return resp.Items || [];
}

async function getRepairById(repairId) {
  const resp = await ddb.send(new GetCommand({ TableName: TABLE, Key: { repair_id: repairId } }));
  return resp.Item || null;
}

async function getRepairCount() {
  const resp = await ddb.send(new ScanCommand({ TableName: TABLE, Select: 'COUNT' }));
  return resp.Count || 0;
}

async function clearAllRepairs() {
  // Scan keys, then batch delete in chunks
  const resp = await ddb.send(new ScanCommand({ TableName: TABLE, ProjectionExpression: 'repair_id' }));
  const items = resp.Items || [];
  if (items.length === 0) return 0;

  const chunks = [];
  for (let i = 0; i < items.length; i += 25) chunks.push(items.slice(i, i + 25));

  let deletedCount = 0;
  for (const chunk of chunks) {
    const req = { RequestItems: {} };
    req.RequestItems[TABLE] = chunk.map(it => ({ DeleteRequest: { Key: { repair_id: it.repair_id } } }));
    await ddb.send(new BatchWriteCommand(req));
    deletedCount += chunk.length;
  }

  return deletedCount;
}

module.exports = {
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
};
