const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Создаем админского пользователя
  const existingAdmin = await prisma.tenant.findUnique({ where: { name: 'admin' } });
  if (existingAdmin) {
    console.log('Admin already exists');
  } else {
    const passwordHash = await bcrypt.hash('adminpass', 10);
    await prisma.tenant.create({
      data: {
        name: 'admin',
        passwordHash,
        status: 'active',
        apiKey: Math.random().toString(36).slice(2, 12)
      }
    });
    console.log('Admin created successfully!');
  }

  // Создаем тестовых арендаторов
  const testTenants = [
    {
      name: 'KazanMall',
      status: 'active',
      maxStaff: 50,
      apiKey: Math.random().toString(36).slice(2, 12)
    },
    {
      name: 'TestStore',
      status: 'active',
      maxStaff: 25,
      apiKey: Math.random().toString(36).slice(2, 12)
    }
  ];

  for (const tenantData of testTenants) {
    const existing = await prisma.tenant.findUnique({ where: { name: tenantData.name } });
    if (!existing) {
      await prisma.tenant.create({
        data: tenantData
      });
      console.log(`Tenant ${tenantData.name} created successfully!`);
    } else {
      console.log(`Tenant ${tenantData.name} already exists`);
    }
  }

  console.log('Database seeding completed!');
}

main().finally(() => prisma.$disconnect());
