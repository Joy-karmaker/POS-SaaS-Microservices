<?php

declare(strict_types=1);

namespace App\Services\TenantProvisioning;

use PDO;

final class TenantSchemaProvisioner
{
    public function provision(PDO $connection): void
    {
        $queries = [
            'CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql',

            'CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )',
            'CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                category_id INT NULL,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(100) NULL,
                barcode VARCHAR(100) NULL,
                price DECIMAL(12,2) NOT NULL,
                cost_price DECIMAL(12,2) NULL,
                stock_quantity INT NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                sales_velocity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                stock_out_date TIMESTAMP NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_products_category
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                    ON DELETE SET NULL
            )',
            'CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku)',
            'CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id)',
            'CREATE INDEX IF NOT EXISTS idx_products_stock_out ON products (stock_out_date)',
            'CREATE TABLE IF NOT EXISTS inventory (
                product_id INT PRIMARY KEY,
                stock INT NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_inventory_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            )',
            'DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory',
            'CREATE TRIGGER update_inventory_updated_at
                BEFORE UPDATE ON inventory
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()',

            'CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uniq_stores_tenant_code UNIQUE (tenant_id, code)
            )',
            'CREATE TABLE IF NOT EXISTS shifts (
                id SERIAL PRIMARY KEY,
                tenant_id INT NOT NULL,
                store_id INT NOT NULL,
                user_id INT NOT NULL,
                opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
                closing_balance DECIMAL(12,2) NULL,
                opened_at TIMESTAMP NOT NULL,
                closed_at TIMESTAMP NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_shifts_store
                    FOREIGN KEY (store_id) REFERENCES stores(id)
                    ON DELETE CASCADE
            )',
            'CREATE INDEX IF NOT EXISTS idx_shifts_lookup ON shifts (tenant_id, store_id, user_id, closed_at)',

            'CREATE TABLE IF NOT EXISTS staff_roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(64) NOT NULL,
                code VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uniq_roles_code UNIQUE (code)
            )',
            'CREATE TABLE IF NOT EXISTS staff_profiles (
                user_id INT PRIMARY KEY,
                tenant_id INT NOT NULL,
                store_id INT NOT NULL,
                role_id INT NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(32) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_staff_store
                    FOREIGN KEY (store_id) REFERENCES stores(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_staff_role
                    FOREIGN KEY (role_id) REFERENCES staff_roles(id)
            )',
            'CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                total_amount DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )',
            'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at)',
            'CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                CONSTRAINT fk_sale_items_sale
                    FOREIGN KEY (sale_id) REFERENCES sales(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_sale_items_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            )',
            'CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id)',
            'CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id)',
        ];

        foreach ($queries as $query) {
            $connection->exec($query);
        }

        $this->seedDefaultRoles($connection);
    }

    private function seedDefaultRoles(PDO $connection): void
    {
        $roles = [
            [
                'name' => 'Cashier',
                'code' => 'cashier',
            ],
            [
                'name' => 'Manager',
                'code' => 'manager',
            ],
            [
                'name' => 'Staff',
                'code' => 'staff',
            ],
        ];

        foreach ($roles as $role) {
            $stmt = $connection->prepare('INSERT INTO staff_roles (name, code) VALUES (?, ?) ON CONFLICT (code) DO NOTHING');
            $stmt->execute([$role['name'], $role['code']]);
        }
    }
}
