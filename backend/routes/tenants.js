const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET = process.env.JWT_SECRET || 'secret_key';

// ✅ Получить всех арендаторов с количеством сотрудников (только активных)
router.get('/', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        apiKey: true,
        maxStaff: true,
        _count: {
          select: {
            users: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Создать новый магазин (только для админа)
router.post('/', async (req, res) => {
  try {
    const { name, maxStaff } = req.body;

    // Проверка роли админа по JWT
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
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Только администратор может создавать магазины.' });
    }

    // Валидация данных
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Название магазина обязательно' });
    }

    const trimmedName = name.trim();

    // Проверяем, что такого магазина еще нет
    const existingTenant = await prisma.tenant.findFirst({
      where: { 
        name: trimmedName,
        isDeleted: false 
      }
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Магазин с таким названием уже существует' });
    }

    // Валидация maxStaff
    let maxStaffValue = null;
    if (maxStaff !== undefined && maxStaff !== null && maxStaff !== '') {
      const maxStaffNum = parseInt(maxStaff);
      if (isNaN(maxStaffNum) || maxStaffNum < 0) {
        return res.status(400).json({ error: 'Лимит сотрудников должен быть положительным числом' });
      }
      maxStaffValue = maxStaffNum;
    }

    // Генерируем API ключ
    const crypto = require('crypto');
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Создаем новый магазин
    const newTenant = await prisma.tenant.create({
      data: {
        name: trimmedName,
        apiKey: apiKey,
        maxStaff: maxStaffValue,
        status: 'active', // Сразу активный, так как создает админ
        isDeleted: false,
        // Остальные поля (email, phone, contactPerson, passwordHash) остаются null
        // пока кто-то не зарегистрируется под этим магазином
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        maxStaff: true,
        status: true,
        _count: {
          select: {
            users: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    res.status(201).json(newTenant);
  } catch (err) {
    console.error('Error creating tenant:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Получить одного арендатора по ID (с количеством сотрудников)
router.get('/:id', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        apiKey: true,
        maxStaff: true,
        isDeleted: true,
        status: true,
        email: true,
        phone: true,
        contactPerson: true,
        _count: {
          select: {
            users: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });
    if (!tenant || tenant.isDeleted) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    // Удаляем isDeleted из ответа
    const { isDeleted, ...tenantData } = tenant;
    res.json(tenantData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Обновить данные арендатора (имя и лимит сотрудников)
router.put('/:id', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const { name, maxStaff, email, phone, contactPerson } = req.body;

    // Проверяем роль пользователя по JWT токену
    const authHeader = req.headers.authorization;
    let userRole = null;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, SECRET);
        userRole = decoded.role;
        userId = decoded.id;
      } catch (err) {
        // Токен невалидный, но продолжаем без роли
      }
    }

    // Проверяем, что арендатор существует и не удален
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId, isDeleted: false }
    });

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const data = {};
    
    // Обновляем имя, если оно предоставлено и не пустое
    if (name !== undefined && name !== null) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      data.name = name.trim();
    }
    
    // Обновляем maxStaff, если оно предоставлено
    if (maxStaff !== undefined && maxStaff !== null) {
      if (maxStaff === '' || maxStaff === 0) {
        data.maxStaff = null; // Убираем лимит
      } else {
        const maxStaffNum = parseInt(maxStaff);
        if (isNaN(maxStaffNum) || maxStaffNum < 0) {
          return res.status(400).json({ error: 'maxStaff must be a positive number' });
        }
        data.maxStaff = maxStaffNum;
      }
    }

    // Обновляем email, если предоставлен (только для админа)
    if (email !== undefined && email !== null) {
      // Арендаторы не могут изменять email, только админы
      if (userRole === 'tenant') {
        return res.status(403).json({ 
          error: 'Арендаторы не могут изменять email. Обратитесь к администратору для изменения email.' 
        });
      }
      
      if (email.trim() === '') {
        data.email = null;
      } else {
        data.email = email.trim();
      }
    }
    // Обновляем phone, если предоставлен
    if (phone !== undefined && phone !== null) {
      if (phone.trim() === '') {
        data.phone = null;
      } else {
        data.phone = phone.trim();
      }
    }
    // Обновляем contactPerson, если предоставлен
    if (contactPerson !== undefined && contactPerson !== null) {
      if (contactPerson.trim() === '') {
        data.contactPerson = null;
      } else {
        data.contactPerson = contactPerson.trim();
      }
    }

    // Проверяем, что есть что обновлять
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        apiKey: true,
        maxStaff: true,
        status: true,
        email: true,
        phone: true,
        contactPerson: true,
        _count: {
          select: {
            users: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    res.json(updatedTenant);
  } catch (err) {
    console.error('Error updating tenant:', err);
    res.status(500).json({ error: err.message });
  }
});

// Смена пароля арендатора админом
router.put('/:id/change-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }
    // Проверка роли админа по JWT
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
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Только администратор может менять пароль арендатора.' });
    }
    // Найти арендатора
    const tenant = await prisma.tenant.findUnique({ where: { id: parseInt(id, 10) } });
    if (!tenant) {
      return res.status(404).json({ error: 'Арендатор не найден.' });
    }
    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.tenant.update({
      where: { id: parseInt(id, 10) },
      data: { passwordHash }
    });
    return res.json({ success: true, message: 'Пароль успешно изменен.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Ошибка сервера при смене пароля.' });
  }
});

// Очистить контактные данные арендатора (сброс к состоянию доступному для регистрации)
router.post('/:id/reset-account', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.name === 'admin') {
      return res.status(403).json({ error: 'Admin account cannot be reset.' });
    }

    // Очищаем все данные аккаунта, возвращаем в доступное состояние
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        passwordHash: null,
        email: null,
        phone: null,
        contactPerson: null,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        maxStaff: true,
        status: true,
        email: true,
        phone: true,
        contactPerson: true,
        _count: {
          select: {
            users: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    res.json(updatedTenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить арендатора по ID
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.name === 'admin') {
      return res.status(403).json({ error: 'Admin account cannot be deleted.' });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isDeleted: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;
