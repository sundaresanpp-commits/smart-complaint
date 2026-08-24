require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const ensureDemoAdmin = require('./utils/ensureDemoAdmin');
const runEscalationCheck = require('./utils/escalationJob');
const runResolvedComplaintCleanup = require('./utils/resolvedComplaintCleanup');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  'https://smart-complaint-mgmt.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ''));

const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i,
  /^https:\/\/deploy-preview-\d+--[a-z0-9-]+\.netlify\.app$/i,
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, '');
  return allowedOrigins.includes(normalizedOrigin) || allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin));
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded complaint images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler (e.g. multer file errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message?.startsWith('CORS blocked origin:')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    // Run scheduled complaint maintenance on startup, then every hour.
    runEscalationCheck();
    runResolvedComplaintCleanup();
    setInterval(runEscalationCheck, 60 * 60 * 1000);
    setInterval(runResolvedComplaintCleanup, 60 * 60 * 1000);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}; shutting down server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = port + 1;
      console.warn(`Port ${port} is busy. Trying ${fallbackPort} instead.`);
      server.close(() => startServer(fallbackPort));
      return;
    }

    console.error('Server start error:', error);
    process.exit(1);
  });
};

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  await connectDB();
  await ensureDemoAdmin();
  startServer(PORT);
}

bootstrap().catch((err) => {
  console.error('Server bootstrap error:', err.message);
  process.exit(1);
});

