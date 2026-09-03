const app = require('./app');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🏨 Sridevi Residency API Server running on http://${HOST}:${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
