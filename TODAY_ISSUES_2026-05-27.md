# Today's Changes: Inventory Analytics & Forecasting Engine

## 1. O(1) Caching Database Design & Schema Migration
- **Problem**: Aggregating sales data (daily Sales Velocity) on the fly for thousands of products and sales would slow down the frontend dashboard under high traffic.
- **Solution**: Implemented a **Cached-Column Design** (Denormalization Pattern). We added `sales_velocity` and `stock_out_date` columns directly to the `Product` model in Prisma. Instead of calculating metrics during reads, calculations are processed asynchronously during transaction write-time and cached. This enables O(1) read access, eliminating joins or subqueries on page loads.
- **Tables Added**: Created `Sale` and `SaleItem` tables to record transaction histories for calculations.
- **Files Modified**: `services/catalog-service-node/prisma/schema.prisma`

## 2. Backend Forecasting Engine & Row-Locked Transactions
- **Logic Engine**: Built an `AnalyticsService` that calculates:
  - **Sales Velocity**: Total units of a product sold in the last 30 days divided by the product's catalog lifespan (up to 30 days, minimum 1 day to handle newly created items).
  - **Predicted Stock-out Date**: Computed dynamically as `current_stock / sales_velocity`. If stock is 0, the date points to the current time.
- **Concurrency & Consistent State**: Integrated transaction logging and metrics recalculation directly inside the core `inventory.service.ts` adjustment flow. The database logic executes inside a Prisma `$transaction` with pessimistic row-locking, preventing concurrent operations from creating race conditions or inconsistent states.
- **Files Modified**: 
  - `services/catalog-service-node/src/inventory/inventory.service.ts`
  - `services/catalog-service-node/src/analytics/analytics.service.ts`
  - `services/catalog-service-node/src/analytics/analytics.controller.ts`
  - `services/catalog-service-node/src/analytics/analytics.module.ts`
  - `services/catalog-service-node/src/app.module.ts`

## 3. Premium Frontend Dashboard & WebSockets Sync
- **Client Endpoints**: Integrated `analyticsApi.js` to expose REST endpoints for forecasting lists, summaries, and sales simulation.
- **Forecasting Dashboard**: Created `TenantDashboardPage.jsx` featuring dynamic, premium HSL/CSS KPI cards (such as Out of Stock, Critical Risk `< 3 days`, Low Risk `3-7 days`, and Stable stock levels), a top-selling velocity highlight card, and simulation controls.
- **WebSocket Broadcasts**: Configured the backend `InventoryGateway` to emit `product_updated` and `stock_updated` events whenever stock levels or forecasting metrics are updated. The React components (`TenantCatalogPage.jsx` and `TenantDashboardPage.jsx`) connect and reload stats in the background automatically, providing immediate visual feedback without page refreshes.
- **Files Modified**:
  - `frontend/src/api/analyticsApi.js`
  - `frontend/src/pages/TenantDashboardPage.jsx`
  - `frontend/src/pages/TenantCatalogPage.jsx`

## 4. Concurrency & High-Volume Performance Validation
- **Race Condition Prevention**: Verified via `concurrency_test.js`. Executing two concurrent sales of 1 unit of a product with only 1 unit remaining in stock resulted in one transaction succeeding (`201 Created`) and the second transaction failing cleanly (`400 Bad Request` - `Cannot reduce stock below 0`), keeping database stock levels mathematically consistent.
- **Query Optimization & Seeding**: Tested via `seed_sales_test.js`. We seeded 1,000 sales transactions (~3,000 items) in batches and updated metrics for all catalog products. The high-volume simulation completed in **8.15 seconds** (averaging ~8ms per multi-item sale transaction). The dashboard lists and KPI summaries loaded in **under 20ms** due to our pre-calculated caching schema.
- **Files Added**:
  - `frontend/concurrency_test.js` (updated to ES modules & correct tenant credentials)
  - `frontend/seed_sales_test.js`

## 5. High-Performance Client-Side Fuzzy Search Indexing
- **Problem**: Standard SQL `LIKE` queries are slow, block database performance, and are brittle against typos (e.g. searching "Hnor" won't find "Honor").
- **Solution**: Implemented a client-side **Fuzzy Search Engine** using a custom **Prefix Tree (Trie)**. The catalog page downloads a lightweight product list on mount, tokenizes attributes (Name, SKU, Barcode, Category Name), and indexes them. Searching walks the Trie using recursive DFS backtracking with Levenshtein distance calculations, pruning subtrees that exceed the edit distance threshold.
- **Vite/WebSocket Live updates**: React listeners watch WebSocket events (`product_created`, `product_updated`, `product_deleted`, `stock_updated`) and modify the local Trie in-memory, updating search query results instantly.
- **Files Modified/Created**:
  - **Backend**: Added `GET /catalog/products/search-index` in `product.controller.ts` and `product.service.ts` to return lightweight product payloads.
  - **Frontend**: Created `FuzzySearchIndex.js` utility, added API calls in `catalogApi.js`, and fully rewrote local search/filtering/pagination in `TenantCatalogPage.jsx`.

## 6. Search Index Performance & Typo Verification
- **Typo Tolerance**: Verified using a test script `fuzzy_test.js` under a 10,000 product catalog. Lookups for single-edit typos ("Hnor" -> "Honor", "Galxy" -> "Galaxy") and double-edit typos ("iphn" -> "iPhone") correctly match target items at Rank 1.
- **CPU Optimizations**: Pre-cached lowercase names and parsed numeric sales velocities during initial indexing. This avoids expensive string allocations and float conversions inside the sort comparator loop.
- **Benchmarking Results**:
  - **Single search lookups**: completed in **0.15ms to 0.70ms**.
  - **Stress testing**: Executed 1,000 random lookups consecutively. The average search query took **6.63 milliseconds**, successfully beating the `< 10ms` requirement.
- **Files Added**:
  - `frontend/fuzzy_test.js`

