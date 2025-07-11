const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    console.log('Все арендаторы:');
    tenants.forEach(tenant => {
      console.log(`ID: ${tenant.id}, Имя: ${tenant.name}, Статус: ${tenant.status}`);
    });
    
    const approvedTenants = await prisma.tenant.findMany({
      where: {
        status: 'approved',
        isDeleted: false
      }
    });
    
    console.log(`\nОдобренных арендаторов: ${approvedTenants.length}`);
    
    const turnovers = await prisma.turnover.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    
    console.log(`\nВсего товарооборота: ${turnovers.length}`);
    turnovers.forEach(t => {
      console.log(`ID арендатора: ${t.tenantId}, Имя: ${t.tenant.name}, Статус: ${t.tenant.status}, Месяц: ${t.month}/${t.year}, Сумма: ${t.amountWithVat}`);
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants(); 