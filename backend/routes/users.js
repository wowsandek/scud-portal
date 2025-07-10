// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Получить всех сотрудников по tenantId
router.get('/:tenantId', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const users = await prisma.user.findMany({
      where: {
        tenantId: tenantId,
        isDeleted: false,
      },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить нового сотрудника
router.post('/', async (req, res) => {
  try {
    const { tenantId, fullName, cardNumber } = req.body;
    const user = await prisma.user.create({
      data: {
        tenantId,
        fullName,
        cardNumber,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Удалить сотрудника (soft-delete)
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
