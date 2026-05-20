"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const dbUrl = process.env.DATABASE_URL || `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/control_plane`;
const adapter = new adapter_mariadb_1.PrismaMariaDb(dbUrl);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    let tenantId = 1;
    const existingCategory = await prisma.category.findFirst();
    if (existingCategory) {
        tenantId = existingCategory.tenant_id;
        console.log(`Using existing tenant_id: ${tenantId}`);
    }
    else {
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
//# sourceMappingURL=seed.js.map