CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories (tenant_id);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  category_id INTEGER NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NULL,
  barcode VARCHAR(100) NULL,
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2) NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sales_velocity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock_out_date TIMESTAMP NULL,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products (tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at ON sales (tenant_id, created_at);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items (product_id);