# 🎯 POS SaaS Microservices — Module-by-Module Team Execution Plan

> **Agile Team Structure**: 🧑‍💻 **1 Developer** | ⚙️ **1 DevOps Engineer** | 🧪 **1 SQA Engineer**  
> **Goal**: Build, verify, and lock down every module step-by-step with 0 chaos.

---

## 🧭 How This Plan Works
Every module follows a strict 3-task structure before it is marked **"DONE"**:
1. 🧑‍💻 **Developer**: Writes API endpoints, database schemas, and business logic.
2. ⚙️ **DevOps**: Configures Docker containers, Redis/RabbitMQ connections, and CI pipelines.
3. 🧪 **SQA**: Executes API tests, security scans, edge-case tests, and load tests.
4. ✅ **Module Sign-Off**: All 3 team members sign off before moving to the next module.

---

## 🏗️ MODULE 0: Infrastructure & Core Gateway Foundation

### 1. 📌 What to Do
Establish local and cloud base infrastructure (MySQL 8.4, Redis 7.4, RabbitMQ 3.13, Nginx API Gateway).

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Define initial database schemas for MySQL (`pos_db`).
  - Create standardized JSON response structure across all microservices.
* **⚙️ DevOps**:
  - Configure `docker-compose.yml` with healthchecks for MySQL, Redis, and RabbitMQ.
  - Set up Nginx `gateway/nginx.conf` to proxy `/api/auth`, `/api/tenant`, `/api/catalog`.
* **🧪 SQA**:
  - Run `docker compose up -d` and ping `http://localhost:8080/health`.
  - Verify Nginx correctly routes requests to background services.

### 3. ✅ Final "Module 0 Done" Sign-Off
- [ ] MySQL, Redis, RabbitMQ report **Healthy** status in `docker ps`.
- [ ] Nginx Gateway successfully routes a test HTTP ping request.

---

## 🔑 MODULE 1: Auth, Tenant & Staff Service
*Code Location: `services/auth-service-laravel` & `services/tenant-service-laravel`*

### 1. 📌 What to Do
Implement multi-tenant login, tenant registration, cashier staff roles, and JWT issue/verification.

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Create DB tables: `tenants`, `stores`, `users`, `shifts`.
  - Implement `POST /auth/login` issuing JWT containing `tenant_id`, `user_id`, `store_id`, `role`.
  - Add middleware to reject requests without a valid JWT signature.
* **⚙️ DevOps**:
  - Configure JWT Secret key in container environment (`AUTH_JWT_SECRET`).
  - Set up Redis connection for active session caching & token blacklist.
* **🧪 SQA**:
  - Test valid & invalid login credentials using Bruno/Postman.
  - **Tenant Isolation Check**: Verify Tenant A's JWT token gets HTTP 403 when requesting Tenant B's data.
  - **Rate Limit Test**: Send 20 rapid login attempts; verify HTTP 429 after 5 failed attempts.

### 3. ✅ Final "Module 1 Done" Sign-Off
- [ ] JWT contains all required claims (`tenant_id`, `user_id`, `role`).
- [ ] 0 cross-tenant data leaks found in SQA security test.
- [ ] SQA API Test Suite passes 100%.

---

## 📦 MODULE 2: Product Catalog & Inventory Service
*Code Location: `services/catalog-service-node`*

### 1. 📌 What to Do
Manage products, categories, SKUs, and real-time inventory stock levels.

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Build NestJS CRUD endpoints: `GET /products`, `POST /products`, `PUT /products/:id`.
  - Add composite index on `(tenant_id, sku)` in Prisma schema.
  - Implement atomic inventory update SQL (`UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND stock >= ?`).
  - Emit WebSocket (`inventory.updated`) event when stock changes.
* **⚙️ DevOps**:
  - Configure Redis Cache-Aside pattern for `GET /products` (`tenant:{id}:products`).
  - Add Nginx WebSocket upgrade headers (`Upgrade` / `Connection "Upgrade"`).
* **🧪 SQA**:
  - **Stock Over-selling Test**: Run `k6` script with 50 concurrent requests trying to buy 5 remaining items. Verify exactly 5 succeed and final stock is 0.
  - **Cache Speed Test**: Run `autocannon -c 100 http://localhost:3000/products`; verify response time < 15ms.

### 3. ✅ Final "Module 2 Done" Sign-Off
- [ ] Zero negative stock allowed under concurrency test.
- [ ] Redis cache returns product lists in under 15ms.
- [ ] Prisma queries include `tenant_id` scope.

---

## 🛒 MODULE 3: Cart & Pricing Engine

### 1. 📌 What to Do
Manage cart items per session, apply tax, automatic discounts, and price calculations.

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Build endpoints: `POST /cart`, `POST /cart/items`, `POST /pricing/calculate`.
  - Use integer cents or `Decimal.js` for tax/discount calculations to prevent floating point errors.
* **⚙️ DevOps**:
  - Store temporary cart data in Redis with a 24-hour TTL (`tenant:{id}:cart:{cart_id}`).
* **🧪 SQA**:
  - Test math precision: Add items $0.10 + $0.20 + 15% tax; verify total is exactly $0.35.
  - Test cart expiration: Verify abandoned cart keys automatically expire after TTL.

### 3. ✅ Final "Module 3 Done" Sign-Off
- [ ] Tax & discount calculations accurate to 2 decimal places.
- [ ] Cart data stored efficiently in Redis with auto-eviction TTL.

---

## 💳 MODULE 4: Order & Payment Processing (Financial Core)

### 1. 📌 What to Do
Process cashier checkout, record orders, process payments, and ensure financial idempotency.

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Build `POST /orders` and `POST /payments`.
  - Require `Idempotency-Key` header on checkout requests.
  - Implement **Transactional Outbox Pattern**: Write order record + outbox event in a single DB transaction.
* **⚙️ DevOps**:
  - Configure RabbitMQ producer to publish `order.paid` events from Outbox.
* **🧪 SQA**:
  - **Duplicate Payment Test**: Send 2 identical requests with the same `Idempotency-Key`; verify payment is charged ONLY once.
  - **Payment Failure Rollback Test**: Force a payment gateway error; verify order state remains `PENDING` (no orphaned paid orders!).

### 3. ✅ Final "Module 4 Done" Sign-Off
- [ ] Idempotency prevents duplicate charges 100% of the time.
- [ ] DB Transaction rolls back completely if payment fails.
- [ ] `order.paid` event correctly sent to RabbitMQ.

---

## 🔔 MODULE 5: Async & Support Systems (Queue Workers & Audit)

### 1. 📌 What to Do
Process async receipt notifications, update analytics/reporting, and write audit logs without slowing down cashier checkout.

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Build RabbitMQ consumer workers listening for `order.paid` and `shift.closed`.
  - Write audit logs to PostgreSQL / MySQL `audit_logs` table.
* **⚙️ DevOps**:
  - Configure RabbitMQ consumer prefetch count (`prefetch(50)`).
  - Set up Dead-Letter Queue (DLQ) for failed message handling.
* **🧪 SQA**:
  - **Queue Backpressure Test**: Flood RabbitMQ with 5,000 order events; verify queue workers process all messages without worker crash or memory leaks.

### 3. ✅ Final "Module 5 Done" Sign-Off
- [ ] Order checkout speed is unaffected by slow notification/audit operations.
- [ ] 0 unhandled poison messages (all failures routed to DLQ).

---

## 🖥️ MODULE 6: POS Frontend Terminal UI & Cashier Flow

### 1. 📌 What to Do
Provide intuitive, high-speed POS Cashier UI for product scanning, cart management, checkout, and receipt printing.

### 2. How to Do It
* **🧑‍💻 Developer**:
  - Build Vite / React / Vue single-page cashier application.
  - Implement Optimistic UI (item added to cart instantly on barcode scan).
  - Connect WebSocket for live stock badge updates.
* **⚙️ DevOps**:
  - Deploy static frontend build to Nginx / Vercel with gzip compression enabled.
* **🧪 SQA**:
  - **End-to-End Cashier Flow Test**:
    1. Login -> 2. Select Store -> 3. Add 3 Items to Cart -> 4. Checkout Cash Payment -> 5. View Receipt.
  - Verify total end-to-end checkout completion time is < 3 seconds.

### 3. ✅ Final "Module 6 Done" Sign-Off
- [ ] Cashier can complete full checkout flow seamlessly.
- [ ] UI gracefully handles offline / weak network states.

---

## 📊 Agile Module Progress Tracker

| Module | Name | Developer | DevOps | SQA | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Module 0** | Infrastructure & Base Gateway | [ ] | [ ] | [ ] | ⏳ In Progress |
| **Module 1** | Auth, Tenant & Staff Service | [ ] | [ ] | [ ] | 🛑 Pending |
| **Module 2** | Product Catalog & Inventory | [ ] | [ ] | [ ] | 🛑 Pending |
| **Module 3** | Cart & Pricing Engine | [ ] | [ ] | [ ] | 🛑 Pending |
| **Module 4** | Order & Payment Processing | [ ] | [ ] | [ ] | 🛑 Pending |
| **Module 5** | Async Support & Audit Queue | [ ] | [ ] | [ ] | 🛑 Pending |
| **Module 6** | POS Frontend Terminal UI | [ ] | [ ] | [ ] | 🛑 Pending |
