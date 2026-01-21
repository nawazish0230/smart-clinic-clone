const { extractTokenFromHeader } = require('./auth');
const { validateToken } = require('./auth');

module.exports = {
  extractTokenFromHeader,
  validateToken,
};

