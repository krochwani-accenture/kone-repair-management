const { ddb } = require('../dynamoClient');
const {
  GetCommand,
  ScanCommand,
  DeleteCommand,
  BatchWriteCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.DYNAMO_TABLE_NAME || 'Repairs';

const REPAIR_FIELDS = [
  'equipment_type',
  'service_category',
  'base_price',
  'service_hours',
  'availability',
  'description',
  'notes',
];

function buildRepairFields(row) {
  return {
    equipment_type: row['Equipment Type'] || '',
    service_category: row['Service Category'] || '',
    base_price: Number(row['Base Price']) || 0,
    service_hours: Number(row['Service Hours']) || 0,
    availability: row['Availability'] || '',
    description: row['Description'] || '',
    notes: row['Notes'] || '',
  };
}

function hasRepairChanges(existing, incoming) {
  if (!existing) return true;
  return REPAIR_FIELDS.some((field) => existing[field] !== incoming[field]);
}

async function saveRepairsToDatabase(repairs, userId = 'system') {
  let inserted = 0;
  let updated = 0;
  let saved = 0;
  let skipped = 0;
  let unchanged = 0;
  const errors = [];

  for (const r of repairs) {
    try {
      const repairId = r['Repair ID'];

      if (!repairId) {
        skipped++;
        errors.push('Missing Repair ID');
        continue;
      }

      const repairFields = buildRepairFields(r);
      const existingResp = await ddb.send(
        new GetCommand({
          TableName: TABLE,
          Key: { repair_id: repairId },
        })
      );
      const existing = existingResp.Item || null;

      if (!hasRepairChanges(existing, repairFields)) {
        unchanged++;
        skipped++;
        continue;
      }

      const now = new Date().toISOString();

      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { repair_id: repairId },
          UpdateExpression: [
            'SET #equipment_type = :equipment_type',
            '#service_category = :service_category',
            '#base_price = :base_price',
            '#service_hours = :service_hours',
            '#availability = :availability',
            '#description = :description',
            '#notes = :notes',
            '#userId = :userId',
            '#source = :source',
            '#created_at = if_not_exists(#created_at, :now)',
            '#updated_at = :now',
          ].join(', '),
          ExpressionAttributeNames: {
            '#equipment_type': 'equipment_type',
            '#service_category': 'service_category',
            '#base_price': 'base_price',
            '#service_hours': 'service_hours',
            '#availability': 'availability',
            '#description': 'description',
            '#notes': 'notes',
            '#userId': 'userId',
            '#source': 'source',
            '#created_at': 'created_at',
            '#updated_at': 'updated_at',
          },
          ExpressionAttributeValues: {
            ':equipment_type': repairFields.equipment_type,
            ':service_category': repairFields.service_category,
            ':base_price': repairFields.base_price,
            ':service_hours': repairFields.service_hours,
            ':availability': repairFields.availability,
            ':description': repairFields.description,
            ':notes': repairFields.notes,
            ':userId': userId,
            ':source': 'excel-upload',
            ':now': now,
          },
        })
      );

      if (existing) {
        updated++;
      } else {
        inserted++;
      }
      saved++;
    } catch (err) {
      errors.push(err.message || String(err));
    }
  }

  return { inserted, updated, saved, skipped, unchanged, errors };
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
