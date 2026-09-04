"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RestockService", {
    enumerable: true,
    get: function() {
        return RestockService;
    }
});
const _common = require("@nestjs/common");
const _tenantconnectionservice = require("../tenant/tenant-connection.service");
const _inventoryservice = require("../inventory/inventory.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
let RestockService = class RestockService {
    async create(tenantId, user, dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new _common.BadRequestException('Restock order must have at least one product item');
        }
        const pool = await this.tenantConnectionService.getPool(tenantId);
        const client = await this.tenantConnectionService.getClient(tenantId);
        const orderNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        const warehouseName = dto.warehouse_name || 'Central Distribution Hub';
        const notes = dto.notes || null;
        const requestedBy = user?.username || user?.email || 'Store Manager';
        // Verify all products exist and calculate total units and cost
        let totalItems = 0;
        let totalCost = 0;
        const preparedItems = [];
        for (const it of dto.items){
            const product = await client.product.findUnique({
                where: {
                    id: it.product_id
                }
            });
            if (!product) {
                throw new _common.NotFoundException(`Product #${it.product_id} not found in catalog`);
            }
            const qty = Number(it.quantity) || 1;
            const costPrice = Number(it.cost_price ?? product.cost_price ?? 0);
            totalItems += qty;
            totalCost += qty * costPrice;
            preparedItems.push({
                product_id: product.id,
                product_name: product.name,
                sku: product.sku || null,
                quantity: qty,
                cost_price: costPrice
            });
        }
        // Insert order in transaction
        const pgClient = await pool.connect();
        try {
            await pgClient.query('BEGIN');
            const orderRes = await pgClient.query(`INSERT INTO restock_orders (order_number, warehouse_name, status, total_items, total_cost, payment_status, notes, requested_by)
         VALUES ($1, $2, 'REQUESTED', $3, $4, 'UNPAID', $5, $6)
         RETURNING *`, [
                orderNumber,
                warehouseName,
                totalItems,
                totalCost,
                notes,
                requestedBy
            ]);
            const order = orderRes.rows[0];
            const createdItems = [];
            for (const item of preparedItems){
                const itemRes = await pgClient.query(`INSERT INTO restock_order_items (restock_order_id, product_id, product_name, sku, quantity, cost_price)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`, [
                    order.id,
                    item.product_id,
                    item.product_name,
                    item.sku,
                    item.quantity,
                    item.cost_price
                ]);
                createdItems.push(itemRes.rows[0]);
            }
            await pgClient.query('COMMIT');
            this.logger.log(`Created Restock Order ${orderNumber} (Tenant #${tenantId}) with ${totalItems} units, total cost $${totalCost.toFixed(2)}`);
            return {
                ...order,
                items: createdItems
            };
        } catch (err) {
            await pgClient.query('ROLLBACK');
            throw err;
        } finally{
            pgClient.release();
        }
    }
    async findAll(tenantId, filters) {
        const pool = await this.tenantConnectionService.getPool(tenantId);
        let query = 'SELECT * FROM restock_orders';
        const params = [];
        if (filters?.status && filters.status !== 'ALL') {
            query += ' WHERE status = $1';
            params.push(filters.status);
        }
        query += ' ORDER BY id DESC';
        const ordersRes = await pool.query(query, params);
        const orders = ordersRes.rows;
        if (orders.length === 0) return [];
        // Fetch items for all returned orders
        const orderIds = orders.map((o)=>o.id);
        const itemsRes = await pool.query(`SELECT * FROM restock_order_items WHERE restock_order_id = ANY($1::int[]) ORDER BY id ASC`, [
            orderIds
        ]);
        const itemsByOrder = new Map();
        for (const item of itemsRes.rows){
            if (!itemsByOrder.has(item.restock_order_id)) {
                itemsByOrder.set(item.restock_order_id, []);
            }
            itemsByOrder.get(item.restock_order_id).push(item);
        }
        return orders.map((o)=>({
                ...o,
                items: itemsByOrder.get(o.id) || []
            }));
    }
    async findOne(tenantId, id) {
        const pool = await this.tenantConnectionService.getPool(tenantId);
        const orderRes = await pool.query('SELECT * FROM restock_orders WHERE id = $1', [
            id
        ]);
        if (orderRes.rows.length === 0) {
            throw new _common.NotFoundException(`Restock Order #${id} not found`);
        }
        const order = orderRes.rows[0];
        const itemsRes = await pool.query('SELECT * FROM restock_order_items WHERE restock_order_id = $1 ORDER BY id ASC', [
            id
        ]);
        return {
            ...order,
            items: itemsRes.rows
        };
    }
    async dispatch(tenantId, id) {
        const pool = await this.tenantConnectionService.getPool(tenantId);
        const order = await this.findOne(tenantId, id);
        if (order.status !== 'REQUESTED') {
            throw new _common.BadRequestException(`Cannot dispatch order #${id} in status '${order.status}'`);
        }
        const res = await pool.query(`UPDATE restock_orders SET status = 'DISPATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [
            id
        ]);
        this.logger.log(`Restock Order #${id} marked as DISPATCHED`);
        return {
            ...res.rows[0],
            items: order.items
        };
    }
    async cancel(tenantId, id) {
        const pool = await this.tenantConnectionService.getPool(tenantId);
        const order = await this.findOne(tenantId, id);
        if (order.status === 'RECEIVED') {
            throw new _common.BadRequestException(`Cannot cancel order #${id} because stock has already been received into inventory`);
        }
        const res = await pool.query(`UPDATE restock_orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [
            id
        ]);
        this.logger.log(`Restock Order #${id} marked as CANCELLED`);
        return {
            ...res.rows[0],
            items: order.items
        };
    }
    async markReceived(tenantId, id) {
        const pool = await this.tenantConnectionService.getPool(tenantId);
        const order = await this.findOne(tenantId, id);
        if (order.status === 'RECEIVED') {
            this.logger.warn(`Restock Order #${id} is already marked as RECEIVED`);
            return order;
        }
        if (order.status === 'CANCELLED') {
            throw new _common.BadRequestException(`Cannot receive cancelled order #${id}`);
        }
        // 1. Replenish physical store stock for each item using InventoryService
        const replenishedProducts = [];
        for (const it of order.items){
            const updated = await this.inventoryService.adjustStock(tenantId, {
                product_id: it.product_id,
                quantity_change: Number(it.quantity)
            });
            replenishedProducts.push(updated);
        }
        // 2. Update order status to RECEIVED
        const res = await pool.query(`UPDATE restock_orders 
       SET status = 'RECEIVED', received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`, [
            id
        ]);
        this.logger.log(`Restock Order #${id} (${order.order_number}) successfully RECEIVED. Shelf stock replenished!`);
        return {
            ...res.rows[0],
            items: order.items,
            replenished_products: replenishedProducts
        };
    }
    async markPaid(tenantId, id, paymentData) {
        const pool = await this.tenantConnectionService.getPool(tenantId);
        const order = await this.findOne(tenantId, id);
        const paymentId = paymentData.payment_id ? Number(paymentData.payment_id) : null;
        const gateway = paymentData.gateway || 'ONLINE';
        const res = await pool.query(`UPDATE restock_orders 
       SET payment_status = 'PAID', payment_id = $1, payment_gateway = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`, [
            paymentId,
            gateway,
            id
        ]);
        this.logger.log(`Restock Order #${id} successfully marked as PAID via ${gateway} (Payment #${paymentId})`);
        return {
            ...res.rows[0],
            items: order.items
        };
    }
    constructor(tenantConnectionService, inventoryService){
        this.tenantConnectionService = tenantConnectionService;
        this.inventoryService = inventoryService;
        this.logger = new _common.Logger(RestockService.name);
    }
};
RestockService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService,
        typeof _inventoryservice.InventoryService === "undefined" ? Object : _inventoryservice.InventoryService
    ])
], RestockService);

//# sourceMappingURL=restock.service.js.map