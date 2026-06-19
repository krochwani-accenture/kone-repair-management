const { ddb } = require('../dynamoClient');
const {
  GetCommand,
  ScanCommand,
  BatchWriteCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.DYNAMO_TABLE_NAME || 'Repairs';

// Canonical data contract for PricingManagement.xlsx.
const PRICING_FIELDS = [
  'category_1',
  'category_2',
  'category_3',
  'action',
  'item',
  'translation_done',
  'extended_to_sales_org',
  'price_valid',
  'editable_product_details',
];
const REQUIRED_COLUMNS = [
  'ID',
  'Category 1',
  'Category 2',
  'Category 3',
  'Action',
  'Item',
  'Translation Done',
  'Extended to Sales Org',
  'Price Valid',
  'Editable Product Details',
];

function asBoolean(value) {
  if (typeof value === 'boolean') return value;
  return (
    String(value ?? '')
      .trim()
      .toLowerCase() === 'yes'
  );
}

function buildPricingFields(row) {
  return {
    category_1: String(row['Category 1'] ?? '').trim(),
    category_2: String(row['Category 2'] ?? '').trim(),
    category_3: String(row['Category 3'] ?? '').trim(),
    action: String(row.Action ?? '').trim(),
    item: String(row.Item ?? '').trim(),
    translation_done: asBoolean(row['Translation Done']),
    extended_to_sales_org: asBoolean(row['Extended to Sales Org']),
    price_valid: asBoolean(row['Price Valid']),
    editable_product_details: asBoolean(row['Editable Product Details']),
  };
}

function validatePricingRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, error: 'The selected sheet has no data rows.' };
  }
  const columns = new Set(rows.flatMap((row) => Object.keys(row)));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  return missing.length
    ? {
        valid: false,
        error: `Invalid pricing sheet. Missing columns: ${missing.join(', ')}`,
      }
    : { valid: true };
}

function hasPricingChanges(existing, incoming) {
  return (
    !existing ||
    PRICING_FIELDS.some((field) => existing[field] !== incoming[field])
  );
}

async function saveRepairsToDatabase(
  rows,
  userId = 'system',
  source = 'excel-upload'
) {
  const validation = validatePricingRows(rows);
  if (!validation.valid) throw new Error(validation.error);

  let inserted = 0;
  let updated = 0;
  let saved = 0;
  let skipped = 0;
  let unchanged = 0;
  const errors = [];

  for (const row of rows) {
    const repairId = String(row.ID ?? '').trim();
    if (!repairId) {
      skipped++;
      errors.push('Missing ID');
      continue;
    }

    try {
      const pricingFields = buildPricingFields(row);
      const existing = (
        await ddb.send(
          new GetCommand({
            TableName: TABLE,
            Key: { repair_id: repairId },
          })
        )
      ).Item;

      if (!hasPricingChanges(existing, pricingFields)) {
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
            'SET #category_1 = :category_1',
            '#category_2 = :category_2',
            '#category_3 = :category_3',
            '#action = :action',
            '#item = :item',
            '#translation_done = :translation_done',
            '#extended_to_sales_org = :extended_to_sales_org',
            '#price_valid = :price_valid',
            '#editable_product_details = :editable_product_details',
            '#userId = :userId',
            '#source = :source',
            '#created_at = if_not_exists(#created_at, :now)',
            '#updated_at = :now',
          ].join(', '),
          ExpressionAttributeNames: Object.fromEntries([
            ...PRICING_FIELDS.map((field) => [`#${field}`, field]),
            ['#userId', 'userId'],
            ['#source', 'source'],
            ['#created_at', 'created_at'],
            ['#updated_at', 'updated_at'],
          ]),
          ExpressionAttributeValues: {
            ...Object.fromEntries(
              PRICING_FIELDS.map((field) => [`:${field}`, pricingFields[field]])
            ),
            ':userId': userId,
            ':source': source,
            ':now': now,
          },
        })
      );

      if (existing) updated++;
      else inserted++;
      saved++;
    } catch (err) {
      errors.push(`${repairId}: ${err.message || String(err)}`);
    }
  }

  return { inserted, updated, saved, skipped, unchanged, errors };
}

async function getAllRepairs() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const response = await ddb.send(
      new ScanCommand({ TableName: TABLE, ExclusiveStartKey })
    );
    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function getRepairById(repairId) {
  const response = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { repair_id: repairId } })
  );
  return response.Item || null;
}

async function getRepairCount() {
  let count = 0;
  let ExclusiveStartKey;
  do {
    const response = await ddb.send(
      new ScanCommand({ TableName: TABLE, Select: 'COUNT', ExclusiveStartKey })
    );
    count += response.Count || 0;
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return count;
}

async function clearAllRepairs() {
  const items = await getAllRepairs();
  for (let i = 0; i < items.length; i += 25) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE]: items.slice(i, i + 25).map(({ repair_id }) => ({
            DeleteRequest: { Key: { repair_id } },
          })),
        },
      })
    );
  }
  return items.length;
}

module.exports = {
  REQUIRED_COLUMNS,
  validatePricingRows,
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
};
