const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const CHANGELOG_TABLE = process.env.CHANGELOG_TABLE_NAME || 'RepairsChangeLog';
const IGNORED_DIFF_FIELDS = new Set(['updated_at', 'userId', 'source']);

exports.handler = async (event) => {
  console.log('Stream event received:', JSON.stringify(event));

  const results = [];

  for (const record of event.Records) {
    try {
      const { dynamodb, eventName, eventID, eventSource } = record;

      // Only process MODIFY events (skip INSERT to avoid logging on creation)
      if (eventName !== 'MODIFY') {
        console.log(`Skipping ${eventName} event`);
        continue;
      }

      // Extract old and new images
      const oldImage = dynamodb.OldImage ? unmarshall(dynamodb.OldImage) : null;
      const newImage = unmarshall(dynamodb.NewImage);

      // Compute diff
      const diff = computeDiff(oldImage, newImage);

      if (eventName === 'MODIFY' && !diff) {
        console.log(
          `Skipping MODIFY event with no audited field changes for repair ${newImage.repair_id || newImage.id}`
        );
        continue;
      }

      // Build changelog entry
      const changelogEntry = {
        repairId: newImage.repair_id || newImage.id,
        eventTimestamp: String(record.dynamodb.ApproximateCreationDateTime),
        changeType: eventName,
        streamRecordId: eventID,
        oldImage: oldImage || null,
        newImage: newImage,
        diff: diff,
        userId: newImage.userId || 'system',
        source: eventSource || 'dynamodb-stream',
      };

      // Write to changelog table
      await docClient.send(
        new PutCommand({
          TableName: CHANGELOG_TABLE,
          Item: changelogEntry,
        })
      );

      results.push({ recordId: eventID, status: 'success' });
      console.log(
        `Processed ${eventName} for repair ${changelogEntry.repairId}`
      );
    } catch (error) {
      console.error('Error processing record:', error);
      results.push({
        recordId: record.eventID,
        status: 'error',
        error: error.message,
      });
    }
  }

  return {
    statusCode: 200,
    batchItemFailures: [],
    processedCount: results.length,
  };
};

/**
 * Compute field-level diff between old and new values
 */
function computeDiff(oldImage, newImage) {
  if (!oldImage) return null;

  const diff = {};
  for (const key in newImage) {
    if (IGNORED_DIFF_FIELDS.has(key)) {
      continue;
    }

    if (oldImage[key] !== newImage[key]) {
      diff[key] = { old: oldImage[key], new: newImage[key] };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}
