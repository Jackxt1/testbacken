require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger'); // เรียกใช้ config ที่คุณสร้างไว้
const sequelize = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
// แก้ไข Helmet เพื่อให้รองรับการแสดงผลของ Swagger UI (Inline Scripts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https://validator.swagger.io"],
      },
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors());

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 5,              // สูงสุด 5 ครั้ง
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 1 minute',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// ── Body Parser ───────────────────────────────────────────────────────────────
// ต้องวางก่อน Routes และ API Docs เพื่อให้ Swagger อ่านค่าตัวอย่างได้ถูกต้อง
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── API Docs ──────────────────────────────────────────────────────────────────
// เข้าถึงที่ http://localhost:3000/api-docs ตามเงื่อนไขในรูปภาพ
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth/login', loginLimiter); 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    // ระวัง: sync({ force: false }) ใน production
    await sequelize.sync();
    logger.info('Database connection established');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    logger.error('Unable to connect to database:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;