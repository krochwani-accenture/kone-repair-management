const {
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
} = require('../utils/db_dynamo');
const jwt = require('jsonwebtoken');
const users = require('../users');
const XLSX = require('xlsx');
const Busboy = require('busboy');

const SECRET = process.env.JWT_SECRET || 'demo-secret-key';

/**
 * Create JWT token for user
 */
function createToken(user) {
  return jwt.sign(
    {
      username: user.username,
      role: user.role,
      regions: user.regions,
    },
    SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Extract region from Notes field
 */
function extractRegionFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/Region:\s*([A-Z]+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Filter repairs by region
 */
function filterRepairsByRegion(repairs, userRole, userRegions) {
  if (userRole === 'global') return repairs;
  const allowedRegions = userRegions || [];
  return repairs.filter(repair => {
    const region = extractRegionFromNotes(repair.notes || '');
    return region && allowedRegions.includes(region);
  });
}

/**
 * Parse auth header and return user
 */
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

/**
 * Build CORS headers
 */
function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,content-type',
  };
}

/**
 * Parse Excel file from buffer
 */
function parseExcelFile(fileBuffer, sheetName = null) {
  try {
    // Validate buffer
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new Error('Invalid file buffer: empty or not a buffer');
    }

    // Check for valid Excel file signature (ZIP header)
    const header = fileBuffer.slice(0, 4).toString('hex');
    if (header !== '504b0304') {
      throw new Error(`Invalid Excel file format. Expected ZIP header, got: ${header}`);
    }

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const selectedSheet = sheetName && workbook.SheetNames.includes(sheetName)
      ? sheetName
      : workbook.SheetNames[0];
    const sheet = workbook.Sheets[selectedSheet];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    return {
      success: true,
      data: jsonData,
      rowCount: jsonData.length,
      columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
      sheetName: selectedSheet,
      availableSheets: workbook.SheetNames,
    };
  } catch (error) {
    console.error("XLSX ERROR:", error);

    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Normalize file content - preserve binary data integrity
 */
function normalizeFileContent(content) {
  // If already a buffer, return as-is
  if (Buffer.isBuffer(content)) {
    return content;
  }

  // If it's a string, try to decode as base64 only if it's valid base64
  if (typeof content === 'string') {
    try {
      // Only attempt base64 decode if string length is multiple of 4 and contains only base64 chars
      if (content.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(content.trim())) {
        return Buffer.from(content.trim(), 'base64');
      }
    } catch (err) {
      // If base64 decode fails, fall through to utf8
    }
    // Default to utf8 for strings
    return Buffer.from(content, 'utf8');
  }

  // For other types, convert to buffer
  return Buffer.from(content);
}

function parseMultipartEvent(event) {
  return new Promise((resolve, reject) => {
    const contentTypeHeader =
      event.headers?.['content-type'] || event.headers?.['Content-Type'] || '';
    const busboy = Busboy({ headers: { 'content-type': contentTypeHeader } });
    const result = { files: [] };

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const buffers = [];
      file.on('data', data => buffers.push(data));
      file.on('end', () => {
        if (buffers.length > 0) {
          result.files.push({
            filename,
            content: Buffer.concat(buffers),
            contentType: mimetype,
            encoding,
            fieldname,
          });
        }
      });
    });

    busboy.on('field', (fieldname, value) => {
      result[fieldname] = value;
    });

    busboy.on('error', reject);
    busboy.on('finish', () => resolve(result));

    // Convert body to buffer - handle all cases
    let bodyBuffer;
    if (Buffer.isBuffer(event.body)) {
      bodyBuffer = event.body;
    } else if (typeof event.body === 'string') {
      // If isBase64Encoded is true, decode from base64
      if (event.isBase64Encoded) {
        bodyBuffer = Buffer.from(event.body, 'base64');
      } else {
        // Otherwise treat as string and convert to buffer
        bodyBuffer = Buffer.from(event.body, 'utf8');
      }
    } else {
      bodyBuffer = Buffer.from('');
    }

    console.log('Multipart body buffer size:', bodyBuffer.length, 'bytes');
    busboy.end(bodyBuffer);
  });
}

function getExcelSheets(fileBuffer) {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    return {
      success: true,
      sheets: workbook.SheetNames,
      count: workbook.SheetNames.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const method = event.httpMethod || (event.requestContext?.http?.method);
  const path = event.rawPath || event.path || (event.requestContext?.http?.path) || '';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: buildHeaders(),
      body: '',
    };
  }

  try {
    // ===== AUTH ROUTES (PUBLIC) =====
    if (method === 'POST' && path.includes('/auth/login')) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const { username, password } = body || {};

      if (!username || !password) {
        return {
          statusCode: 400,
          headers: buildHeaders(),
          body: JSON.stringify({
            success: false,
            error: 'Username and password required',
          }),
        };
      }

      const user = users.find(u => u.username === username && u.password === password);
      if (!user) {
        return {
          statusCode: 401,
          headers: buildHeaders(),
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
          }),
        };
      }

      const token = createToken(user);
      return {
        statusCode: 200,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: true,
          token,
          user: {
            username: user.username,
            role: user.role,
            regions: user.regions,
          },
        }),
      };
    }

    // ===== UPLOAD ROUTES (PUBLIC - NO AUTH) =====
    if (method === 'POST' && path.includes('/upload/info')) {
      try {
        const parsed = await parseMultipartEvent(event);
        if (!parsed.files || parsed.files.length === 0) {
          throw new Error('No file found in upload request');
        }

        const file = parsed.files[0];
        const fileBuffer = normalizeFileContent(file.content);
        const result = getExcelSheets(fileBuffer);

        return {
          statusCode: result.success ? 200 : 400,
          headers: buildHeaders(),
          body: JSON.stringify(result),
        };
      } catch (err) {
        return {
          statusCode: 400,
          headers: buildHeaders(),
          body: JSON.stringify({
            success: false,
            error: err.message,
          }),
        };
      }
    }

    if (method === 'POST' && path.includes('/upload') && !path.includes('/upload/info')) {
      try {
        const parsed = await parseMultipartEvent(event);

        console.log("===== MULTIPART DEBUG =====");
        console.log("Files found:", parsed.files?.length);

        const file = parsed.files[0];

        const fileBuffer = normalizeFileContent(file.content);

        console.log("Filename:", file.filename);
        console.log("ContentType:", file.contentType);
        console.log("typeof content:", typeof file.content);
        console.log("IsBuffer:", Buffer.isBuffer(file.content));
        console.log("First 20 bytes:", fileBuffer.slice(0, 20).toString("hex"));

        const sheetName = parsed.sheetName || null;
        const result = parseExcelFile(fileBuffer, sheetName);

        console.log("Parse Result:", result);

        return {
          statusCode: result.success ? 200 : 400,
          headers: buildHeaders(),
          body: JSON.stringify(result),
        };

      } catch (err) {
        return {
          statusCode: 400,
          headers: buildHeaders(),
          body: JSON.stringify({
            success: false,
            error: err.message,
          }),
        };
      }
    }

    // ===== PROTECTED ROUTES (REQUIRE AUTH) =====
    const authUser = getAuthUser(event);
    if (!authUser) {
      return {
        statusCode: 401,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: false,
          error: 'Missing or invalid authorization header',
        }),
      };
    }

    // ===== REPAIRS ROUTES =====
    if (method === 'POST' && path.includes('/repairs/save')) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const data = body?.data;

      if (!data || !Array.isArray(data)) {
        return {
          statusCode: 400,
          headers: buildHeaders(),
          body: JSON.stringify({
            success: false,
            error: 'Invalid data format',
          }),
        };
      }

      // Region users can only save to their region
      if (authUser.role === 'region') {
        const allowedRegion = authUser.regions[0];
        for (const item of data) {
          const region = extractRegionFromNotes(item.Notes || '');
          if (region && region !== allowedRegion) {
            return {
              statusCode: 403,
              headers: buildHeaders(),
              body: JSON.stringify({
                success: false,
                error: `You can only save repairs for region: ${allowedRegion}`,
              }),
            };
          }
        }
      }

      const result = await saveRepairsToDatabase(data);
      return {
        statusCode: 200,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: true,
          data: {
            inserted: result.inserted,
            skipped: result.skipped,
            total: data.length,
            errors: result.errors,
          },
        }),
      };
    }

    if (method === 'GET' && path.includes('/repairs/count/total')) {
      let count;
      if (authUser.role === 'global') {
        count = await getRepairCount();
      } else {
        const repairs = await getAllRepairs();
        const filtered = filterRepairsByRegion(repairs, authUser.role, authUser.regions);
        count = filtered.length;
      }

      return {
        statusCode: 200,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: true,
          data: { total: count },
        }),
      };
    }

    if (method === 'GET' && path.match(/\/repairs\/[A-Za-z0-9-_]+$/)) {
      const parts = path.split('/');
      const repairId = parts[parts.length - 1];
      const repair = await getRepairById(repairId);

      if (!repair) {
        return {
          statusCode: 404,
          headers: buildHeaders(),
          body: JSON.stringify({
            success: false,
            error: 'Repair not found',
          }),
        };
      }

      // Region access check
      if (authUser.role === 'region') {
        const repairRegion = extractRegionFromNotes(repair.notes || '');
        if (!repairRegion || !authUser.regions.includes(repairRegion)) {
          return {
            statusCode: 403,
            headers: buildHeaders(),
            body: JSON.stringify({
              success: false,
              error: `Access denied. You only have access to regions: ${authUser.regions.join(', ')}`,
            }),
          };
        }
      }

      return {
        statusCode: 200,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: true,
          data: repair,
        }),
      };
    }

    if (method === 'GET' && path.includes('/repairs')) {
      const repairs = await getAllRepairs();
      const filtered = filterRepairsByRegion(repairs, authUser.role, authUser.regions);

      return {
        statusCode: 200,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: true,
          data: filtered,
          count: filtered.length,
          message: `Retrieved ${filtered.length} repairs (role: ${authUser.role})`,
        }),
      };
    }

    if (method === 'DELETE' && path.includes('/repairs/clear')) {
      const deleted = await clearAllRepairs();
      return {
        statusCode: 200,
        headers: buildHeaders(),
        body: JSON.stringify({
          success: true,
          data: { deleted },
        }),
      };
    }

    // Not found
    return {
      statusCode: 404,
      headers: buildHeaders(),
      body: JSON.stringify({
        success: false,
        error: 'Not implemented',
      }),
    };
  } catch (err) {
    console.error('[Lambda Error]', err);
    return {
      statusCode: 500,
      headers: buildHeaders(),
      body: JSON.stringify({
        success: false,
        error: err.message || 'Internal server error',
      }),
    };
  }
};
