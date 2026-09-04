require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const floorRoutes = require('./routes/floors.routes');
const roomRoutes = require('./routes/rooms.routes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customers.routes');
const bookingRoutes = require('./routes/bookings.routes');
const revenueRoutes = require('./routes/revenue.routes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Sridevi Residency Management System API',
    timezone: 'Asia/Kolkata',
    timestamp: new Date().toISOString(),
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/statistics', statsRoutes);
app.use('/api/stats', statsRoutes);

// Static files serving from client build
const clientBuildPath = fs.existsSync(path.resolve(__dirname, '../../client/dist'))
  ? path.resolve(__dirname, '../../client/dist')
  : path.resolve(process.cwd(), 'client/dist');

app.use(express.static(clientBuildPath, {
  maxAge: '1h',
  etag: true,
}));

// Fallback all non-API GET requests to SPA index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Frontend build not found. Please run npm run build.');
});

const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

module.exports = app;
