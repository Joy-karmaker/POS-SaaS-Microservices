const { Pool } = require('pg');

async function seedProducts() {
  const host = process.env.DB_HOST || 'postgres';
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
    console.log('No tenants found.');
    return;
  }

  const tenant = tenantRes.rows[0];
  console.log(`Seeding sample catalog into Tenant #${tenant.id} (${tenant.name} -> ${tenant.db_name})...`);

  const tenantPool = new Pool({
    host,
    port,
    user,
    password,
    database: tenant.db_name,
  });

  try {
    // 1. Categories
    const categoryData = [
      { name: 'Beverages', desc: 'Cold and hot drinks, juices, soda' },
      { name: 'Bakery', desc: 'Fresh bread, cookies, and pastries' },
      { name: 'Dairy & Eggs', desc: 'Milk, cheese, butter, and eggs' },
      { name: 'Snacks & Sweets', desc: 'Chips, chocolate, nuts, and candies' },
      { name: 'Household', desc: 'Cleaning supplies, detergents, paper towels' },
    ];

    const categoryMap = {};
    for (const c of categoryData) {
      const res = await tenantPool.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name',
        [c.name, c.desc]
      );
      categoryMap[c.name] = res.rows[0].id;
    }

    // 2. Products
    const productsData = [
      { name: 'Cold Brew Coffee 330ml', cat: 'Beverages', sku: 'BEV-001', price: 4.50, cost: 2.10, stock: 12 },
      { name: 'Organic Orange Juice 1L', cat: 'Beverages', sku: 'BEV-002', price: 5.20, cost: 2.80, stock: 8 },
      { name: 'Sparkling Mineral Water 500ml', cat: 'Beverages', sku: 'BEV-003', price: 2.00, cost: 0.80, stock: 25 },
      { name: 'Whole Wheat Bread Loaf', cat: 'Bakery', sku: 'BAK-001', price: 3.80, cost: 1.50, stock: 5 },
      { name: 'Butter Croissant 4-Pack', cat: 'Bakery', sku: 'BAK-002', price: 6.50, cost: 3.20, stock: 4 },
      { name: 'Chocolate Chip Cookies (Box)', cat: 'Bakery', sku: 'BAK-003', price: 4.99, cost: 2.00, stock: 15 },
      { name: 'Fresh Whole Milk 1 Gal', cat: 'Dairy & Eggs', sku: 'DAI-001', price: 4.20, cost: 2.90, stock: 6 },
      { name: 'Greek Yogurt 500g', cat: 'Dairy & Eggs', sku: 'DAI-002', price: 3.50, cost: 1.80, stock: 0 }, // Out of stock demo
      { name: 'Organic Grade A Eggs (Dozen)', cat: 'Dairy & Eggs', sku: 'DAI-003', price: 5.50, cost: 3.40, stock: 14 },
      { name: 'Artisan Potato Chips 150g', cat: 'Snacks & Sweets', sku: 'SNK-001', price: 3.20, cost: 1.30, stock: 3 }, // Low stock
      { name: 'Dark Chocolate Almond Bar 100g', cat: 'Snacks & Sweets', sku: 'SNK-002', price: 2.99, cost: 1.20, stock: 20 },
      { name: 'Eco Dish Soap 750ml', cat: 'Household', sku: 'HOU-001', price: 4.80, cost: 2.50, stock: 18 },
    ];

    for (const p of productsData) {
      await tenantPool.query(
        `INSERT INTO products (category_id, name, sku, price, cost_price, stock_quantity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [categoryMap[p.cat], p.name, p.sku, p.price, p.cost, p.stock]
      );
    }

    console.log(`Inserted ${productsData.length} products into tenant ${tenant.db_name}.`);
  } finally {
    await tenantPool.end();
  }
}

seedProducts().catch(console.error);
