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
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Месяц должен быть от 1 до 12' });
    }
    if (yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({ error: 'Год должен быть от 2020 до 2030' });
    }
    
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // --- КОНВЕРТАЦИЯ В PDF ---
    let pdfFilePath = null;
    const ext = path.extname(req.file.filename).toLowerCase();
    const excelOrWord = ['.xlsx', '.xls', '.docx', '.doc'].includes(ext);
    if (excelOrWord) {
      // Путь к исходному файлу
      const inputPath = req.file.path;
      // Путь к папке для PDF
      const outputDir = path.dirname(inputPath);
      // Ожидаемое имя PDF
      const pdfName = req.file.filename + '.pdf';
      const pdfFullPath = path.join(outputDir, pdfName);
      try {
        // Конвертация через LibreOffice с альбомной ориентацией
        const { execSync } = require('child_process');
        let convertCmd = '';
        if (['.xlsx', '.xls'].includes(ext)) {
          convertCmd = `libreoffice --headless --convert-to pdf:\"calc_pdf_Export:PageOrientation=2\" --outdir "${outputDir}" "${inputPath}"`;
        } else if (['.docx', '.doc'].includes(ext)) {
          convertCmd = `libreoffice --headless --convert-to pdf:\"writer_pdf_Export:PageOrientation=2\" --outdir "${outputDir}" "${inputPath}"`;
        } else {
          convertCmd = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
        }
        execSync(convertCmd);
        // Найти PDF-файл (LibreOffice может дать имя без .xlsx/.docx)
        const baseName = path.basename(req.file.filename, ext);
        const possiblePdf = path.join(outputDir, baseName + '.pdf');
        if (fs.existsSync(possiblePdf)) {
          pdfFilePath = path.relative(path.join(__dirname, '..'), possiblePdf);
        } else if (fs.existsSync(pdfFullPath)) {
          pdfFilePath = path.relative(path.join(__dirname, '..'), pdfFullPath);
        }
      } catch (e) {
        console.error('Ошибка конвертации в PDF:', e);
      }
    }
    // --- КОНЕЦ КОНВЕРТАЦИИ ---

    // Сбросить isLatest у всех предыдущих отчётов за этот период
    await prisma.turnover.updateMany({
      where: {
        tenantId: parseInt(tenantId),
        month: monthNum,
        year: yearNum,
        isLatest: true
      },
      data: { isLatest: false }
    });

    // Создать новый отчёт (старый утверждённый отчёт остаётся без изменений)
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
        fileType: req.file.mimetype,
        approvalStatus: 'pending',
        isLatest: true,
        pdfFilePath: pdfFilePath || null
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
    // Получаем только approved отчёты за год
    const turnovers = await prisma.turnover.findMany({
      where: {
        tenantId: parseInt(tenantId),
        year: parseInt(year),
        approvalStatus: 'approved'
      },
      orderBy: {
        month: 'asc'
      }
    });
    // Для каждого месяца берём последний approved отчёт (по updatedAt)
    const latestByMonth = {};
    turnovers.forEach(t => {
      if (!latestByMonth[t.month] || new Date(t.updatedAt) > new Date(latestByMonth[t.month].updatedAt)) {
        latestByMonth[t.month] = t;
      }
    });
    // Формируем массив для всех 12 месяцев
    const chartData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const turnover = latestByMonth[month];
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
    
    // Получаем все отчёты за указанный период (утверждённые и pending)
    const turnovers = await prisma.turnover.findMany({
      where: {
        year: yearNum,
        month: monthNum,
        OR: [
          { approvalStatus: 'approved' },
          { approvalStatus: 'pending', isLatest: true }
        ]
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
    
    // Группируем по tenantId и выбираем приоритет: pending > approved
    const latestTurnovers = {};
    turnovers.forEach(turnover => {
      const key = turnover.tenantId;
      if (!latestTurnovers[key] || 
          (turnover.approvalStatus === 'pending' && latestTurnovers[key].approvalStatus === 'approved') ||
          (turnover.approvalStatus === latestTurnovers[key].approvalStatus && turnover.updatedAt > latestTurnovers[key].updatedAt)) {
        latestTurnovers[key] = turnover;
      }
    });
    
    // Формируем результат для всех арендаторов
    const result = tenants.map(tenant => {
      const turnover = latestTurnovers[tenant.id];
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        hasSubmitted: !!turnover, // <--- добавлено
        amountNoVat: turnover?.amountNoVat || 0,
        amountWithVat: turnover?.amountWithVat || 0,
        receiptsCount: turnover?.receiptsCount || 0,
        fileName: turnover?.fileName || null,
        filePath: turnover?.filePath || null,
        submittedAt: turnover?.createdAt || null,
        updatedAt: turnover?.updatedAt || null,
        approvalStatus: turnover?.approvalStatus || null,
        turnover: turnover || null
      };
    });
    
    res.json({
      period: { year: yearNum, month: monthNum },
      totalTenants: tenants.length,
      submittedCount: Object.keys(latestTurnovers).length,
      pendingCount: tenants.length - Object.keys(latestTurnovers).length,
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

// GET /api/turnover/pending-approval - Получить отчеты на утверждение
router.get('/pending-approval', async (req, res) => {
  try {
    const turnovers = await prisma.turnover.findMany({
      where: {
        approvalStatus: 'pending',
        isLatest: true
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Группируем по tenantId и месяцу/году, берем только самые свежие записи
    const latestTurnovers = turnovers.reduce((acc, turnover) => {
      const key = `${turnover.tenantId}-${turnover.month}-${turnover.year}`;
      if (!acc[key] || acc[key].updatedAt < turnover.updatedAt) {
        acc[key] = turnover;
      }
      return acc;
    }, {});
    
    // Преобразуем обратно в массив
    const result = Object.values(latestTurnovers);
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/turnover/:id/approve - Утвердить отчет
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Сначала получаем отчёт, который утверждаем
    const turnoverToApprove = await prisma.turnover.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!turnoverToApprove) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    
    // Сбрасываем статус всех других отчётов за этот же период
    await prisma.turnover.updateMany({
      where: {
        tenantId: turnoverToApprove.tenantId,
        month: turnoverToApprove.month,
        year: turnoverToApprove.year,
        id: { not: parseInt(id) }
      },
      data: {
        approvalStatus: 'not_approved'
      }
    });
    
    // Утверждаем выбранный отчёт
    const turnover = await prisma.turnover.update({
      where: {
        id: parseInt(id)
      },
      data: {
        approvalStatus: 'approved'
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
    
    res.json({ success: true, turnover });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/turnover/:id/reject - Отклонить отчет
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const turnover = await prisma.turnover.update({
      where: {
        id: parseInt(id)
      },
      data: {
        approvalStatus: 'rejected'
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
    
    res.json({ success: true, turnover });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/turnover/:id - Редактировать данные отчёта (только pending/approved)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amountWithVat, amountNoVat, receiptsCount } = req.body;

    // Получаем отчёт
    const turnover = await prisma.turnover.findUnique({ where: { id: parseInt(id) } });
    if (!turnover) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    if (!["pending", "approved"].includes(turnover.approvalStatus)) {
      return res.status(400).json({ error: 'Редактировать можно только pending или approved отчёты' });
    }

    const updated = await prisma.turnover.update({
      where: { id: parseInt(id) },
      data: {
        amountWithVat: amountWithVat !== undefined ? parseFloat(amountWithVat) : turnover.amountWithVat,
        amountNoVat: amountNoVat !== undefined ? parseFloat(amountNoVat) : turnover.amountNoVat,
        receiptsCount: receiptsCount !== undefined ? parseInt(receiptsCount) : turnover.receiptsCount
      }
    });
    res.json({ success: true, turnover: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/turnover/:id/download - Скачать файл отчёта
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем отчёт
    const turnover = await prisma.turnover.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!turnover) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    
    if (!turnover.filePath) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Проверяем существование файла
    const filePath = path.join(__dirname, '..', turnover.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден на сервере' });
    }
    
    // Отправляем файл
    res.download(filePath, turnover.fileName);
    
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error);
    res.status(500).json({ error: 'Ошибка при скачивании файла' });
  }
});

// GET /api/turnover/:id/view - Просмотреть файл отчёта в браузере
router.get('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем отчёт
    const turnover = await prisma.turnover.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!turnover) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    
    if (!turnover.filePath) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Проверяем существование файла
    const filePath = path.join(__dirname, '..', turnover.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден на сервере' });
    }
    
    // Определяем MIME-тип файла
    const ext = path.extname(turnover.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Устанавливаем заголовки для просмотра в браузере
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Отправляем файл
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Ошибка при просмотре файла:', error);
    res.status(500).json({ error: 'Ошибка при просмотре файла' });
  }
});

// GET /api/turnover/:id/view-pdf - Просмотр PDF-версии файла
router.get('/:id/view-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем отчёт
    const turnover = await prisma.turnover.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!turnover) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    
    if (!turnover.pdfFilePath) {
      return res.status(404).json({ error: 'PDF-версия не найдена' });
    }
    
    // Проверяем существование PDF файла
    const filePath = path.join(__dirname, '..', turnover.pdfFilePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF-файл не найден на сервере' });
    }
    
    // Устанавливаем заголовки для просмотра PDF в браузере
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Отправляем PDF файл
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Ошибка при просмотре PDF:', error);
    res.status(500).json({ error: 'Ошибка при просмотре PDF' });
  }
});

module.exports = router; 