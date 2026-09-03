require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const floorRoutes = require('./routes/floors.routes');
const roomRoutes = require('./routes/rooms.routes');
const customerRoutes = require('./routes/customers.routes');
const bookingRoutes = require('./routes/bookings.routes');
const revenueRoutes = require('./routes/revenue.routes');

const app = express();

const path = require('path');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Sridevi Residency API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/revenue', revenueRoutes);

const fs = require('fs');

// Serve frontend static build files in production
const clientBuildPath = fs.existsSync(path.resolve(__dirname, '../../client/dist'))
  ? path.resolve(__dirname, '../../client/dist')
  : path.resolve(process.cwd(), 'client/dist');

console.log(`📁 Static files serving from: ${clientBuildPath} (exists: ${fs.existsSync(clientBuildPath)})`);

app.use(express.static(clientBuildPath));

// Fallback all non-API GET requests to frontend SPA index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Frontend build not found. Please ensure npm run build was executed.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;
