const {
  saveRepairsToDatabase,
  getAllRepairs,
  getRepairById,
  getRepairCount,
  clearAllRepairs,
} = require('../utils/db_dynamo');

exports.handler = async function (event) {
  try {
    const method = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method);
    const path = event.path || (event.requestContext && event.requestContext.http && event.requestContext.http.path) || '';

    if (method === 'POST' && path.endsWith('/save')) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (!body || !Array.isArray(body.data)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid payload' }) };
      }
      const result = await saveRepairsToDatabase(body.data);
      return { statusCode: 200, body: JSON.stringify({ success: true, data: result }) };
    }

    if (method === 'GET' && path.endsWith('/repairs')) {
      const items = await getAllRepairs();
      return { statusCode: 200, body: JSON.stringify({ success: true, data: items }) };
    }

    if (method === 'GET' && /\/repairs\/[A-Za-z0-9-_]+$/.test(path)) {
      const parts = path.split('/');
      const repairId = parts[parts.length - 1];
      const item = await getRepairById(repairId);
      if (!item) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Not found' }) };
      return { statusCode: 200, body: JSON.stringify({ success: true, data: item }) };
    }

    if (method === 'GET' && path.endsWith('/count/total')) {
      const count = await getRepairCount();
      return { statusCode: 200, body: JSON.stringify({ success: true, data: { total: count } }) };
    }

    if (method === 'DELETE' && path.endsWith('/clear')) {
      const deleted = await clearAllRepairs();
      return { statusCode: 200, body: JSON.stringify({ success: true, data: { deleted } }) };
    }

    return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Not implemented' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
