const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-2';

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

module.exports = { ddb };
