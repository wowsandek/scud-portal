require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json()); // ✅ достаточно только этого

// Роуты
const tenantsRouter = require('./routes/tenants');
app.use('/api/tenants', tenantsRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const requestsRouter = require('./routes/requests');
app.use('/api/requests', requestsRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Новый роут для товарооборота
const turnoverRouter = require('./routes/turnover');
app.use('/api/turnover', turnoverRouter);

// Раздача файлов
app.use('/uploads', express.static('uploads'));

// Проверка сервера
app.get('/', (req, res) => {
  res.send('SCUD Portal Server is running!');
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
