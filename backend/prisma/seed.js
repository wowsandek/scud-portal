const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Инициализация базы данных...');

  // Создаем админского пользователя
  const existingAdmin = await prisma.tenant.findUnique({ where: { name: 'admin' } });
  if (existingAdmin) {
    console.log('ℹ️  Администратор уже существует');
  } else {
    const passwordHash = await bcrypt.hash('adminpass', 10);
    await prisma.tenant.create({
      data: {
        name: 'admin',
        passwordHash,
        status: 'active',
        apiKey: 'admin-api-key-' + Math.random().toString(36).slice(2, 8),
        maxStaff: null,
        isDeleted: false
      }
    });
    console.log('✅ Администратор создан успешно!');
    console.log('   Логин: admin');
    console.log('   Пароль: adminpass');
  }

  console.log('🎉 Инициализация завершена!');
}

main().finally(() => prisma.$disconnect());
