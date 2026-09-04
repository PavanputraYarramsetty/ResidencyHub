const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}] Server Error:`, err);
  } else {
    logger.warn(`[${req.method} ${req.originalUrl}] Client Error (${statusCode}): ${message}`);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.details ? { details: err.details } : {})
  });
}

module.exports = { errorHandler };
