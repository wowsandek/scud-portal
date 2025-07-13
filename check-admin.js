const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.tenant.findFirst({
      where: { name: 'admin' }
    });
    console.log('Admin:', {
      id: admin.id,
      name: admin.name,
      status: admin.status,
      hasPassword: !!admin.passwordHash,
      passwordLength: admin.passwordHash ? admin.passwordHash.length : 0
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin(); 