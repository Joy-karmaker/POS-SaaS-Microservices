import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateRestockOrderDto } from './dto/create-restock-order.dto';

@Injectable()
export class RestockService {
  private readonly logger = new Logger(RestockService.name);

  constructor(
    private tenantConnectionService: TenantConnectionService,
    private inventoryService: InventoryService,
  ) {}

  async create(tenantId: number, user: any, dto: CreateRestockOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Restock order must have at least one product item');
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
    const preparedItems: { product_id: number; product_name: string; sku: string | null; quantity: number; cost_price: number }[] = [];

    for (const it of dto.items) {
      const product = await client.product.findUnique({ where: { id: it.product_id } });
      if (!product) {
        throw new NotFoundException(`Product #${it.product_id} not found in catalog`);
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
        cost_price: costPrice,
      });
    }

    // Insert order in transaction
    const pgClient = await pool.connect();
    try {
      await pgClient.query('BEGIN');

      const orderRes = await pgClient.query(
        `INSERT INTO restock_orders (order_number, warehouse_name, status, total_items, total_cost, payment_status, notes, requested_by)
         VALUES ($1, $2, 'REQUESTED', $3, $4, 'UNPAID', $5, $6)
         RETURNING *`,
        [orderNumber, warehouseName, totalItems, totalCost, notes, requestedBy],
      );
      const order = orderRes.rows[0];

      const createdItems = [];
      for (const item of preparedItems) {
        const itemRes = await pgClient.query(
          `INSERT INTO restock_order_items (restock_order_id, product_id, product_name, sku, quantity, cost_price)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [order.id, item.product_id, item.product_name, item.sku, item.quantity, item.cost_price],
        );
        createdItems.push(itemRes.rows[0]);
      }

      await pgClient.query('COMMIT');
      this.logger.log(`Created Restock Order ${orderNumber} (Tenant #${tenantId}) with ${totalItems} units, total cost $${totalCost.toFixed(2)}`);

      return {
        ...order,
        items: createdItems,
      };
    } catch (err: any) {
      await pgClient.query('ROLLBACK');
      throw err;
    } finally {
      pgClient.release();
    }
  }

  async findAll(tenantId: number, filters?: { status?: string }) {
    const pool = await this.tenantConnectionService.getPool(tenantId);
    let query = 'SELECT * FROM restock_orders';
    const params: any[] = [];

    if (filters?.status && filters.status !== 'ALL') {
      query += ' WHERE status = $1';
      params.push(filters.status);
    }
    query += ' ORDER BY id DESC';

    const ordersRes = await pool.query(query, params);
    const orders = ordersRes.rows;

    if (orders.length === 0) return [];

    // Fetch items for all returned orders
    const orderIds = orders.map((o) => o.id);
    const itemsRes = await pool.query(
      `SELECT * FROM restock_order_items WHERE restock_order_id = ANY($1::int[]) ORDER BY id ASC`,
      [orderIds],
    );

    const itemsByOrder = new Map<number, any[]>();
    for (const item of itemsRes.rows) {
      if (!itemsByOrder.has(item.restock_order_id)) {
        itemsByOrder.set(item.restock_order_id, []);
      }
      itemsByOrder.get(item.restock_order_id)!.push(item);
    }

    return orders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    }));
  }

  async findOne(tenantId: number, id: number) {
    const pool = await this.tenantConnectionService.getPool(tenantId);
    const orderRes = await pool.query('SELECT * FROM restock_orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) {
      throw new NotFoundException(`Restock Order #${id} not found`);
    }
    const order = orderRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM restock_order_items WHERE restock_order_id = $1 ORDER BY id ASC', [id]);

    return {
      ...order,
      items: itemsRes.rows,
    };
  }

  async dispatch(tenantId: number, id: number) {
    const pool = await this.tenantConnectionService.getPool(tenantId);
    const order = await this.findOne(tenantId, id);

    if (order.status !== 'REQUESTED') {
      throw new BadRequestException(`Cannot dispatch order #${id} in status '${order.status}'`);
    }

    const res = await pool.query(
      `UPDATE restock_orders SET status = 'DISPATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id],
    );
    this.logger.log(`Restock Order #${id} marked as DISPATCHED`);
    return {
      ...res.rows[0],
      items: order.items,
    };
  }

  async cancel(tenantId: number, id: number) {
    const pool = await this.tenantConnectionService.getPool(tenantId);
    const order = await this.findOne(tenantId, id);

    if (order.status === 'RECEIVED') {
      throw new BadRequestException(`Cannot cancel order #${id} because stock has already been received into inventory`);
    }

    const res = await pool.query(
      `UPDATE restock_orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id],
    );
    this.logger.log(`Restock Order #${id} marked as CANCELLED`);
    return {
      ...res.rows[0],
      items: order.items,
    };
  }

  async markReceived(tenantId: number, id: number) {
    const pool = await this.tenantConnectionService.getPool(tenantId);
    const order = await this.findOne(tenantId, id);

    if (order.status === 'RECEIVED') {
      this.logger.warn(`Restock Order #${id} is already marked as RECEIVED`);
      return order;
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot receive cancelled order #${id}`);
    }

    // 1. Replenish physical store stock for each item using InventoryService
    const replenishedProducts = [];
    for (const it of order.items) {
      const updated = await this.inventoryService.adjustStock(tenantId, {
        product_id: it.product_id,
        quantity_change: Number(it.quantity),
      });
      replenishedProducts.push(updated);
    }

    // 2. Update order status to RECEIVED
    const res = await pool.query(
      `UPDATE restock_orders 
       SET status = 'RECEIVED', received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id],
    );

    this.logger.log(`Restock Order #${id} (${order.order_number}) successfully RECEIVED. Shelf stock replenished!`);

    return {
      ...res.rows[0],
      items: order.items,
      replenished_products: replenishedProducts,
    };
  }

  async markPaid(tenantId: number, id: number, paymentData: { payment_id?: number | string; gateway?: string; amount?: number }) {
    const pool = await this.tenantConnectionService.getPool(tenantId);
    const order = await this.findOne(tenantId, id);

    const paymentId = paymentData.payment_id ? Number(paymentData.payment_id) : null;
    const gateway = paymentData.gateway || 'ONLINE';

    const res = await pool.query(
      `UPDATE restock_orders 
       SET payment_status = 'PAID', payment_id = $1, payment_gateway = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [paymentId, gateway, id],
    );
    this.logger.log(`Restock Order #${id} successfully marked as PAID via ${gateway} (Payment #${paymentId})`);
    return {
      ...res.rows[0],
      items: order.items,
    };
  }
}
