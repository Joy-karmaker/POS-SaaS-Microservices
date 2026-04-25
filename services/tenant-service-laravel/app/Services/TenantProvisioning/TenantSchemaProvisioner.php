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
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )',
            'CREATE TABLE IF NOT EXISTS inventory (
                product_id CHAR(36) PRIMARY KEY,
                stock INT NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_inventory_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            )',
            'CREATE TABLE IF NOT EXISTS sales (
                id CHAR(36) PRIMARY KEY,
                total_amount DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )',
            'CREATE TABLE IF NOT EXISTS sale_items (
                id CHAR(36) PRIMARY KEY,
                sale_id CHAR(36) NOT NULL,
                product_id CHAR(36) NOT NULL,
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
    }
}
