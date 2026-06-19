const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const XLSX = require('xlsx');
const { saveRepairsToDatabase } = require('../utils/db_dynamo');

const REGION = process.env.AWS_REGION || 'ap-south-2';
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET_NAME;
const s3 = new S3Client({ region: REGION });

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

exports.handler = async (event) => {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  const record = event.Records?.[0];
  if (!record) {
    throw new Error('No S3 record found');
  }

  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  if (!UPLOAD_BUCKET) {
    throw new Error('UPLOAD_BUCKET_NAME is not configured');
  }

  if (bucket !== UPLOAD_BUCKET) {
    console.warn(`Skipping object from unexpected bucket: ${bucket}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, message: 'Bucket mismatch' }),
    };
  }

  const object = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const bodyBuffer = await streamToBuffer(object.Body);

  const workbook = XLSX.read(bodyBuffer, { type: 'buffer' });
  // Import every populated pricing sheet; the previous implementation only
  // processed the first sheet in a multi-sheet PricingManagement workbook.
  const results = [];
  let processed = 0;
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: '',
    });
    if (rows.length === 0) continue;
    const result = await saveRepairsToDatabase(
      rows,
      's3-processor',
      `s3://${bucket}/${key}#${sheetName}`
    );
    results.push({ sheetName, processed: rows.length, ...result });
    processed += rows.length;
  }
  console.log('S3 processing results:', results);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, objectKey: key, processed, results }),
  };
};
