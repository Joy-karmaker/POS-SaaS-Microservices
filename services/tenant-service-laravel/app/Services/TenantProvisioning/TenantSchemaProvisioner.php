<?php

declare(strict_types=1);

namespace App\Services\TenantProvisioning;

use PDO;

final class TenantSchemaProvisioner
{
    public function provision(PDO $connection): void
    {
        $queries = [
            'CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )',
            'CREATE TABLE IF NOT EXISTS inventory (
                product_id INT PRIMARY KEY,
                stock INT NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_inventory_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            )',
            'CREATE TABLE IF NOT EXISTS stores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_stores_tenant_code (tenant_id, code)
            )',
            'CREATE TABLE IF NOT EXISTS shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                store_id INT NOT NULL,
                user_id INT NOT NULL,
                opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
                closing_balance DECIMAL(12,2) NULL,
                opened_at TIMESTAMP NOT NULL,
                closed_at TIMESTAMP NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_shifts_lookup (tenant_id, store_id, user_id, closed_at),
                CONSTRAINT fk_shifts_store
                    FOREIGN KEY (store_id) REFERENCES stores(id)
                    ON DELETE CASCADE
            )',
            'CREATE TABLE IF NOT EXISTS staff_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(64) NOT NULL,
                code VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_roles_code (code)
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
                id INT AUTO_INCREMENT PRIMARY KEY,
                total_amount DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )',
            'CREATE TABLE IF NOT EXISTS sale_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                CONSTRAINT fk_sale_items_sale
                    FOREIGN KEY (sale_id) REFERENCES sales(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_sale_items_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
            )',
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
            $stmt = $connection->prepare('INSERT IGNORE INTO staff_roles (name, code) VALUES (?, ?)');
            $stmt->execute([$role['name'], $role['code']]);
        }
    }
}
