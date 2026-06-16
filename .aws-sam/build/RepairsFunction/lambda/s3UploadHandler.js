const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'demo-secret-key';
const REGION = process.env.AWS_REGION || 'ap-south-2';
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET_NAME;

const s3 = new S3Client({ region: REGION });

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function getAuthUser(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.slice(7);
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function getQueryStringParam(event, name) {
  return (
    event.queryStringParameters?.[name] ||
    event.multiValueQueryStringParameters?.[name]?.[0] ||
    event.queryString?.[name] ||
    null
  );
}

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.rawPath || event.path || event.requestContext?.http?.path || '';

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: buildHeaders(),
      body: '',
    };
  }

  if (method !== 'GET' || !path.includes('/upload/url')) {
    return {
      statusCode: 404,
      headers: buildHeaders(),
      body: JSON.stringify({ success: false, error: 'Not found' }),
    };
  }

  const authUser = getAuthUser(event);
  if (!authUser) {
    return {
      statusCode: 401,
      headers: buildHeaders(),
      body: JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
    };
  }

  const filename = getQueryStringParam(event, 'filename');
  if (!filename) {
    return {
      statusCode: 400,
      headers: buildHeaders(),
      body: JSON.stringify({ success: false, error: 'Filename is required' }),
    };
  }

  if (!UPLOAD_BUCKET) {
    return {
      statusCode: 500,
      headers: buildHeaders(),
      body: JSON.stringify({ success: false, error: 'Upload bucket is not configured' }),
    };
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const objectKey = `uploads/${Date.now()}_${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: UPLOAD_BUCKET,
    Key: objectKey,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    headers: buildHeaders(),
    body: JSON.stringify({ success: true, uploadUrl, objectKey }),
  };
};
