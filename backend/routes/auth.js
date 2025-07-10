const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'secret_key';

/**
 * ✅ Регистрация нового арендатора
 * Статус по умолчанию — 'pending' для ручного одобрения админом
 */
router.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required.' });
    }

    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedPassword) {
      return res.status(400).json({ error: 'Name and password cannot be empty.' });
    }

    // Проверка на дубликаты (включая удаленные)
    const existingTenant = await prisma.tenant.findFirst({
      where: { name: trimmedName }
    });
    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant with this name already exists.' });
    }

    // Генерация хэша пароля
    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    // Генерация случайного apiKey
    const apiKey = crypto.randomBytes(10).toString('hex');

    const autoApprove = process.env.AUTO_APPROVE_REGISTRATIONS === 'true';

    const newTenant = await prisma.tenant.create({
      data: {
        name: trimmedName,
        passwordHash,
        apiKey,
        status: autoApprove ? 'active' : 'pending'
      }
    });

    return res.json({
      success: true,
      message: autoApprove
        ? 'Registration successful and account is active.'
        : 'Registration submitted for approval.',
      tenantId: newTenant.id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

/**
 * ✅ Получить всех арендаторов со статусом 'pending'
 */
router.get('/pending-tenants', async (req, res) => {
  try {
    const pendingTenants = await prisma.tenant.findMany({
      where: { 
        status: 'pending',
        isDeleted: false
      },
      select: {
        id: true,
        name: true
      }
    });
    return res.json(pendingTenants);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching pending tenants.' });
  }
});

/**
 * ✅ Одобрить регистрацию арендатора
 */
router.post('/approve/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    if (!tenant.passwordHash) {
      return res.status(400).json({ error: 'Cannot approve tenant without a password.' });
    }

    await prisma.tenant.update({
      where: { id },
      data: { status: 'active' }
    });

    return res.json({ success: true, message: 'Tenant approved successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during approval.' });
  }
});

/**
 * ✅ Отклонить регистрацию арендатора
 */
router.delete('/reject/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    await prisma.tenant.delete({ where: { id } });
    return res.json({ success: true, message: 'Tenant rejected and deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during rejection.' });
  }
});

/**
 * ✅ Логин
 */
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required.' });
    }

    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    const tenant = await prisma.tenant.findFirst({
      where: { 
        name: trimmedName,
        isDeleted: false
      }
    });

    if (!tenant || !tenant.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials. Check your name and password.' });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Your account has not been approved yet.' });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, tenant.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Check your name and password.' });
    }

    const role = tenant.name === 'admin' ? 'admin' : 'tenant';

    const payload = {
      id: tenant.id,
      name: tenant.name,
      role,
      tenantId: tenant.id
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
