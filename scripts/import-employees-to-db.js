const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  // Читаем сотрудников из файла
  const employees = JSON.parse(fs.readFileSync('employees.json', 'utf-8'));
  if (!Array.isArray(employees)) {
    console.error('employees.json: ожидался массив сотрудников');
    process.exit(1);
  }

  // Кэш для ускорения поиска арендаторов
  const tenantCache = {};

  for (const emp of employees) {
    if (!emp.tenant || !emp.fullName || !emp.cardNumber) {
      console.warn('Пропущен сотрудник из-за отсутствия tenant/fullName/cardNumber:', emp);
      continue;
    }
    const tenantName = emp.tenant.trim();
    if (!tenantCache[tenantName]) {
      // Ищем арендатора по имени
      let tenant = await prisma.tenant.findFirst({ where: { name: tenantName } });
      if (!tenant) {
        // Создаем арендатора, если не найден
        const apiKey = crypto.randomBytes(24).toString('hex');
        tenant = await prisma.tenant.create({
          data: {
            name: tenantName,
            apiKey,
            status: 'active',
            isDeleted: false,
          },
        });
        console.log(`Создан новый арендатор: ${tenantName} (id=${tenant.id})`);
      }
      tenantCache[tenantName] = tenant.id;
    }
    const tenantId = tenantCache[tenantName];
    // Проверяем, есть ли уже такой сотрудник (по cardNumber и tenantId)
    const exists = await prisma.user.findFirst({ where: { cardNumber: emp.cardNumber, tenantId } });
    if (!exists) {
      await prisma.user.create({
        data: {
          tenantId,
          fullName: emp.fullName,
          cardNumber: emp.cardNumber,
          active: true,
          isDeleted: false,
        },
      });
      console.log(`Добавлен сотрудник: ${emp.fullName} (${emp.cardNumber}) для арендатора ${tenantName}`);
    } else {
      // Можно раскомментировать для отладки:
      // console.log(`Сотрудник уже есть: ${emp.fullName} (${emp.cardNumber}) для арендатора ${tenantName}`);
    }
  }
  console.log('Импорт завершён!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Ошибка при импорте сотрудников:', e);
  prisma.$disconnect();
  process.exit(1);
}); 