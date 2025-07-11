require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Оптимизация Prisma - один экземпляр для всего приложения
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const app = express();

// Безопасность
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Сжатие
app.use(compression());

// CORS с оптимизацией
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Парсинг JSON с лимитом
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Кэширование статических файлов
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true,
}));

// Роуты
const tenantsRouter = require('./routes/tenants');
app.use('/api/tenants', tenantsRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const requestsRouter = require('./routes/requests');
app.use('/api/requests', requestsRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const turnoverRouter = require('./routes/turnover');
app.use('/api/turnover', turnoverRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Проверка сервера
app.get('/', (req, res) => {
  res.send('SCUD Portal Server is running!');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
