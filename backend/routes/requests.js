// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получить все заявки (для админки)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;
    const status = req.query.status;
    const tenantSearch = req.query.tenantSearch;

    // Строим условия для фильтрации
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (tenantSearch) {
      where.tenant = {
        name: {
          contains: tenantSearch,
          mode: 'insensitive' // Для PostgreSQL
        }
      };
    }

    // Получаем общую статистику (только если нет фильтров)
    let stats = null;
    if (!status || status === 'all') {
      const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        prisma.request.count({ where: { status: 'pending' } }),
        prisma.request.count({ where: { status: 'approved' } }),
        prisma.request.count({ where: { status: 'rejected' } })
      ]);
      
      stats = {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      };
    }

    const [total, requests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    res.json({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: requests,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Создать новую заявку
router.post('/', async (req, res) => {
  try {
    const { tenantId, additions, removals, comment } = req.body;
    const request = await prisma.request.create({
      data: {
        tenantId,
        additions,
        removals,
        comment,
      },
    });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Одобрить заявку
// Одобрить заявку
router.post('/:id/approve', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);

    // Найдём заявку
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Обновляем статус заявки
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'approved' },
    });

    // Добавляем новых сотрудников
    for (const add of request.additions || []) {
      await prisma.user.create({
        data: {
          tenantId: request.tenantId,
          fullName: add.fullName,
          cardNumber: add.cardNumber,
        },
      });
    }

    // Удаляем сотрудников
    for (const remove of request.removals || []) {
      await prisma.user.deleteMany({
        where: {
          tenantId: request.tenantId,
          fullName: remove.fullName,
          cardNumber: remove.cardNumber,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// Отклонить заявку
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.request.update({
      where: { id: parseInt(id) },
      data: { status: 'rejected' },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


// Получить заявки по tenantId
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: 'Invalid tenantId' });
    }

    const requests = await prisma.request.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

