const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Создать папку, если не существует
const uploadDir = path.join(__dirname, '../uploads/turnover');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Декодируем оригинальное имя файла из UTF-8
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  }
});

// POST /api/turnover
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { tenantId, month, year, amountNoVat, amountWithVat, receiptsCount } = req.body;
    if (!tenantId || !month || !year || !amountNoVat || !amountWithVat || !receiptsCount || !req.file) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    // Проверка валидности месяца и года
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Месяц должен быть от 1 до 12' });
    }
    if (yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({ error: 'Год должен быть от 2020 до 2030' });
    }
    
    // Декодируем оригинальное имя файла
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    const turnover = await prisma.turnover.create({
      data: {
        tenantId: parseInt(tenantId),
        month: monthNum,
        year: yearNum,
        amountNoVat: parseFloat(amountNoVat),
        amountWithVat: parseFloat(amountWithVat),
        receiptsCount: parseInt(receiptsCount),
        fileName: originalName,
        filePath: path.relative(path.join(__dirname, '..'), req.file.path),
        fileSize: req.file.size,
        fileType: req.file.mimetype
      }
    });
    res.json({ success: true, turnover });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/turnover/tenant/:tenantId
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const turnovers = await prisma.turnover.findMany({
      where: {
        tenantId: parseInt(tenantId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(turnovers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/turnover/tenant/:tenantId/chart/:year
router.get('/tenant/:tenantId/chart/:year', async (req, res) => {
  try {
    const { tenantId, year } = req.params;
    const turnovers = await prisma.turnover.findMany({
      where: {
        tenantId: parseInt(tenantId),
        year: parseInt(year)
      },
      orderBy: {
        month: 'asc'
      }
    });
    
    // Создаем массив данных для всех 12 месяцев
    const chartData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const turnover = turnovers.find(t => t.month === month);
      return {
        month,
        monthName: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][index],
        amountNoVat: turnover ? turnover.amountNoVat : 0,
        amountWithVat: turnover ? turnover.amountWithVat : 0,
        receiptsCount: turnover ? turnover.receiptsCount : 0,
        hasData: !!turnover
      };
    });
    
    res.json(chartData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/turnover/all-tenants/:year/:month - Получить товарооборот всех арендаторов за период
router.get('/all-tenants/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    // Получаем всех арендаторов без фильтров
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Получаем товарооборот за указанный период
    const turnovers = await prisma.turnover.findMany({
      where: {
        year: yearNum,
        month: monthNum
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Создаем результат с информацией о том, кто сдал, а кто нет
    const result = tenants.map(tenant => {
      const turnover = turnovers.find(t => t.tenantId === tenant.id);
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        hasSubmitted: !!turnover,
        turnover: turnover || null,
        submittedAt: turnover?.createdAt || null
      };
    });
    
    res.json({
      period: { year: yearNum, month: monthNum },
      totalTenants: tenants.length,
      submittedCount: turnovers.length,
      pendingCount: tenants.length - turnovers.length,
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/turnover/statistics/:year - Получить статистику по годам
router.get('/statistics/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const yearNum = parseInt(year);
    
    // Получаем всех арендаторов без фильтров
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Получаем товарооборот за весь год
    const turnovers = await prisma.turnover.findMany({
      where: {
        year: yearNum
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Создаем статистику по месяцам
    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthTurnovers = turnovers.filter(t => t.month === month);
      
      return {
        month,
        monthName: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][index],
        totalTenants: tenants.length,
        submittedCount: monthTurnovers.length,
        pendingCount: tenants.length - monthTurnovers.length,
        totalAmount: monthTurnovers.reduce((sum, t) => sum + t.amountWithVat, 0),
        totalReceipts: monthTurnovers.reduce((sum, t) => sum + t.receiptsCount, 0)
      };
    });
    
    res.json({
      year: yearNum,
      totalTenants: tenants.length,
      totalTurnover: turnovers.reduce((sum, t) => sum + t.amountWithVat, 0),
      totalReceipts: turnovers.reduce((sum, t) => sum + t.receiptsCount, 0),
      monthlyStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router; 