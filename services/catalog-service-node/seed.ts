import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 5432;
  const user = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'root';

  const cpPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'control_plane',
  });

  const tenantRes = await cpPool.query('SELECT id, name, db_name FROM tenants LIMIT 1');
  await cpPool.end();

  if (tenantRes.rows.length === 0) {
    console.log('No tenants found in control_plane. Please provision a tenant first.');
    return;
  }

  const tenant = tenantRes.rows[0];
  console.log(`Seeding data into Tenant #${tenant.id} (${tenant.name} -> ${tenant.db_name})...`);

  const tenantDbUrl = `postgresql://${user}:${password}@${host}:${port}/${tenant.db_name}`;
  const adapter = new PrismaPg(tenantDbUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Inserting 5 sample categories...');
    const categoryNames = ['Beverages', 'Bakery', 'Dairy', 'Snacks', 'Household'];
    const categories = [];

    for (const name of categoryNames) {
      const category = await prisma.category.create({
        data: {
          name,
          description: `Category for ${name}`,
        },
      });
      categories.push(category);
    }

    console.log('Inserting 20 sample products with inventory & velocity...');
    for (let i = 1; i <= 20; i++) {
      const category = categories[i % categories.length];
      const stock = Math.floor(Math.random() * 80) + 5;
      const velocity = Number((Math.random() * 5 + 0.5).toFixed(2));
      const daysRemaining = stock / velocity;
      const stockOutDate = new Date();
      stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);

      await prisma.product.create({
        data: {
          category_id: category.id,
          name: `Product ${i} (${category.name})`,
          sku: `SKU-${category.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(3, '0')}`,
          barcode: `8901000${i.toString().padStart(5, '0')}`,
          price: Number((Math.random() * 50 + 5).toFixed(2)),
          cost_price: Number((Math.random() * 25 + 2).toFixed(2)),
          stock_quantity: stock,
          is_active: true,
          sales_velocity: velocity,
          stock_out_date: stockOutDate,
        },
      });
    }

    console.log('Dummy tenant data insertion complete!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
