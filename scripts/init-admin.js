const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function initAdmin() {
  try {
    console.log('🔐 Инициализация админа...');

    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.tenant.findFirst({
      where: { name: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Админ уже существует в базе данных');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Email: ${existingAdmin.email || 'не указан'}`);
      console.log(`   Статус: ${existingAdmin.status}`);
      return;
    }

    // Создаем админа
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@scud-portal.com';
    const adminApiKey = crypto.randomBytes(24).toString('hex');
    
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.tenant.create({
      data: {
        name: 'admin',
        apiKey: adminApiKey,
        passwordHash,
        email: adminEmail,
        contactPerson: 'System Administrator',
        status: 'active',
        isDeleted: false
      }
    });

    console.log('✅ Админ успешно создан!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   API Key: ${adminApiKey}`);
    console.log(`   Пароль: ${adminPassword}`);
    console.log('');
    console.log('⚠️  ВАЖНО: Измените пароль админа после первого входа!');
    console.log('   Логин: admin');
    console.log('   Пароль: ' + adminPassword);

  } catch (error) {
    console.error('❌ Ошибка при создании админа:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем инициализацию
initAdmin().catch(console.error); 