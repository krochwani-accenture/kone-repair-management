const jwt = require('jsonwebtoken');
const users = require('./users');

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
 * Login handler - POST /api/auth/login
 * Body: { username, password }
 */
function loginHandler(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required',
      });
    }

    // Find user in demo list
    const user = users.find(u => u.username === username && u.password === password);


    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
        regions: user.regions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Auth middleware - verify JWT and attach user to req
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Region access check middleware
 * Allows global role users to access all, region users only their region
 */
function checkRegionAccess(req, res, next) {
  const region = req.query.region || req.body.region || 'DEFAULT';

  if (req.user.role === 'global') {
    return next(); // Global users can access everything
  }

  if (req.user.regions.includes(region)) {
    return next(); // Region user can access their region
  }

  return res.status(403).json({
    success: false,
    error: `Access denied. You only have access to regions: ${req.user.regions.join(', ')}`,
  });
}

/**
 * Extract region from request
 * Priority: query param > body > user region (for region users) > error
 */
function getRequestRegion(req) {
  const regionParam = req.query.region || req.body.region;
  if (regionParam) return regionParam;
  
  // For region users, use their first region
  if (req.user.role === 'region' && req.user.regions.length > 0) {
    return req.user.regions[0];
  }

  return null;
}

module.exports = {
  createToken,
  loginHandler,
  authMiddleware,
  checkRegionAccess,
  getRequestRegion,
};
