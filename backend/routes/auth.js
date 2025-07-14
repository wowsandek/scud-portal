const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'secret_key';

/**
 * ✅ Получить список магазинов доступных для регистрации
 * Возвращает магазины где:
 * - нет passwordHash (никто не зарегистрировался) 
 * - статус active (одобрен админом)
 * - не удален
 */
router.get('/available-stores', async (req, res) => {
  try {
    const availableStores = await prisma.tenant.findMany({
      where: {
        isDeleted: false,
        status: 'active',
        passwordHash: null
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json(availableStores);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while fetching available stores.' });
  }
});

/**
 * ✅ Регистрация под существующий магазин
 * Обновляет существующий магазин с контактными данными и паролем
 */
router.post('/register', async (req, res) => {
  try {
    const { storeId, password, email, phone, contactPerson } = req.body;

    // Валидация обязательных полей
    if (!storeId || !password || !email || !contactPerson) {
      return res.status(400).json({ 
        error: 'Store selection, password, email and contact person are required.' 
      });
    }

    const trimmedPassword = password.trim();
    const trimmedEmail = email.trim();
    const trimmedContactPerson = contactPerson.trim();
    const trimmedPhone = phone ? phone.trim() : null;

    if (!trimmedPassword || !trimmedEmail || !trimmedContactPerson) {
      return res.status(400).json({ 
        error: 'Password, email and contact person cannot be empty.' 
      });
    }

    // Валидация email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Валидация телефона если указан
    if (trimmedPhone) {
      const phoneRegex = /^[\d\s\-+()]{7,20}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number.' });
      }
    }

    // Проверяем, что магазин существует и доступен для регистрации
    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(storeId) }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    if (tenant.isDeleted || tenant.status !== 'active') {
      return res.status(400).json({ error: 'This store is not available for registration.' });
    }

    // Проверяем, что магазин доступен для регистрации (нет пароля = никто не зарегистрировался)
    if (tenant.passwordHash) {
      return res.status(400).json({ 
        error: 'This store already has an account.' 
      });
    }

    // Проверяем уникальность email среди всех арендаторов
    const existingEmail = await prisma.tenant.findFirst({
      where: { 
        email: trimmedEmail,
        id: { not: parseInt(storeId) }
      }
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'This email is already in use by another store.' });
    }

    // Генерация хэша пароля
    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    // Обновляем магазин с контактными данными и паролем, и меняем статус на pending
    const updatedTenant = await prisma.tenant.update({
      where: { id: parseInt(storeId) },
      data: {
        passwordHash,
        email: trimmedEmail,
        phone: trimmedPhone,
        contactPerson: trimmedContactPerson,
        status: 'pending' // Ожидает одобрения админом
      }
    });

    return res.json({
      success: true,
      message: 'Registration submitted for approval. Please wait for admin confirmation.',
      tenantId: updatedTenant.id,
      storeName: updatedTenant.name
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
        name: true,
        email: true,
        phone: true,
        contactPerson: true
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
 * Очищает контактные данные и пароль, возвращает статус на 'active'
 */
router.delete('/reject/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    if (tenant.status !== 'pending') {
      return res.status(400).json({ error: 'Can only reject pending registrations.' });
    }

    // Очищаем контактные данные и пароль, возвращаем статус active
    await prisma.tenant.update({
      where: { id },
      data: { 
        passwordHash: null,
        email: null,
        phone: null,
        contactPerson: null,
        status: 'active'
      }
    });

    return res.json({ success: true, message: 'Registration rejected. Store is available for registration again.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during rejection.' });
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
 * Админ входит по имени (name), обычные пользователи по email
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    let tenant;

    // Если это админ (логин 'admin'), ищем по name
    if (trimmedEmail === 'admin') {
      tenant = await prisma.tenant.findFirst({
        where: { 
          name: 'admin',
          isDeleted: false
        }
      });
    } else {
      // Для обычных пользователей ищем по email
      tenant = await prisma.tenant.findFirst({
        where: { 
          email: trimmedEmail,
          isDeleted: false
        }
      });
    }

    if (!tenant || !tenant.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials. Check your email and password.' });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Your account has not been approved yet.' });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, tenant.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Check your email and password.' });
    }

    const role = tenant.name === 'admin' ? 'admin' : 'tenant';

    const payload = {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
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

/**
 * ✅ Изменение пароля арендатора
 */
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    if (!trimmedCurrentPassword || !trimmedNewPassword) {
      return res.status(400).json({ error: 'Passwords cannot be empty.' });
    }

    if (trimmedNewPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    // Получаем ID арендатора из токена
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required.' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const tenantId = decoded.id;

    // Получаем арендатора
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant || !tenant.passwordHash) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(trimmedCurrentPassword, tenant.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(trimmedNewPassword, 10);

    // Обновляем пароль
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { passwordHash: newPasswordHash }
    });

    return res.json({ 
      success: true, 
      message: 'Password changed successfully.' 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during password change.' });
  }
});

module.exports = router;
