/**
 * Middleware to authenticate and authorize routes using JWT.
 * Usage example:
 *   router.get('/someRoute', authenticateToken, (req, res) => { ... });
 */

const jwt = require('jsonwebtoken');

// Secret key should match that used for signing JWTs elsewhere
const JWT_SECRET = process.env.JWT_SECRET || 'devsecretkey';

/**
 * Middleware to authenticate JWT via Authorization header.
 * Sets req.user and req.token if successful.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Format: 'Bearer <token>'
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // safe user payload
    req.token = token;
    next();
  });
}

/**
 * Authorization middleware: Checks if user has required role.
 * Usage: router.get('/admin', authenticateToken, authorizeRole('admin'), handler)
 */
function authorizeRole(...requiredRoles) {
  return function(req, res, next) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!requiredRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRole
};