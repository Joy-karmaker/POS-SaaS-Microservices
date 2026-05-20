import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const dbUrl = process.env.DATABASE_URL || `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/control_plane`;
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Try to find an existing tenant ID from categories or products, fallback to 1
  let tenantId = 1;
  const existingCategory = await prisma.category.findFirst();
  if (existingCategory) {
    tenantId = existingCategory.tenant_id;
    console.log(`Using existing tenant_id: ${tenantId}`);
  } else {
    console.log(`No existing records found. Using default tenant_id: ${tenantId}`);
  }

  console.log('Inserting 10 dummy categories...');
  const categories = [];
  for (let i = 1; i <= 10; i++) {
    const category = await prisma.category.create({
      data: {
        tenant_id: tenantId,
        name: `Dummy Category ${i}`,
        description: `This is a dummy category number ${i}`,
      },
    });
    categories.push(category);
  }

  console.log('Inserting 100 dummy products...');
  for (let i = 1; i <= 100; i++) {
    // Randomly assign one of the 10 categories
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    await prisma.product.create({
      data: {
        tenant_id: tenantId,
        category_id: randomCategory.id,
        name: `Dummy Product ${i}`,
        sku: `DUMMY-SKU-${i.toString().padStart(3, '0')}`,
        barcode: `100000000${i.toString().padStart(3, '0')}`,
        price: (Math.random() * 100 + 1).toFixed(2),
        cost_price: (Math.random() * 50 + 1).toFixed(2),
        stock_quantity: Math.floor(Math.random() * 100),
        is_active: true,
      },
    });
  }

  console.log('Dummy data insertion complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
