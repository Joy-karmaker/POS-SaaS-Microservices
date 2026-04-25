<?php

declare(strict_types=1);

namespace App\Services\TenantProvisioning;

use PDO;
use RuntimeException;
use Throwable;

final class TenantDatabaseManager
{
    public function rootConnection(): PDO
    {
        $connection = config('database.connections.mysql');
        $host = (string) ($connection['host'] ?? '127.0.0.1');
        $port = (int) ($connection['port'] ?? 3306);
        $username = (string) ($connection['username'] ?? 'root');
        $password = (string) ($connection['password'] ?? '');

        $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $host, $port);

        return new PDO(
            $dsn,
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }

    public function createDatabase(PDO $rootConnection, string $databaseName): void
    {
        $identifier = $this->assertIdentifier($databaseName);

        $rootConnection->exec(sprintf(
            'CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            $this->quoteIdentifier($identifier)
        ));
    }

    public function createUser(
        PDO $rootConnection,
        string $databaseUser,
        string $databasePassword
    ): void {
        $username = $this->assertIdentifier($databaseUser);

        $rootConnection->exec(sprintf(
            "CREATE USER %s@'%%' IDENTIFIED BY %s",
            $rootConnection->quote($username),
            $rootConnection->quote($databasePassword)
        ));
    }

    public function grantPrivileges(
        PDO $rootConnection,
        string $databaseName,
        string $databaseUser
    ): void {
        $database = $this->assertIdentifier($databaseName);
        $username = $this->assertIdentifier($databaseUser);

        $rootConnection->exec(sprintf(
            "GRANT ALL PRIVILEGES ON %s.* TO %s@'%%'",
            $this->quoteIdentifier($database),
            $rootConnection->quote($username)
        ));
        $rootConnection->exec('FLUSH PRIVILEGES');
    }

    public function tenantConnection(
        string $databaseName,
        string $databaseUser,
        string $databasePassword
    ): PDO {
        $database = $this->assertIdentifier($databaseName);

        $connection = config('database.connections.mysql');
        $host = (string) ($connection['host'] ?? '127.0.0.1');
        $port = (int) ($connection['port'] ?? 3306);

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $host,
            $port,
            $database
        );

        return new PDO(
            $dsn,
            $databaseUser,
            $databasePassword,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }

    public function rollback(
        PDO $rootConnection,
        string $databaseName,
        string $databaseUser,
        bool $databaseCreated,
        bool $userCreated
    ): void {
        $database = $this->assertIdentifier($databaseName);
        $username = $this->assertIdentifier($databaseUser);

        if ($userCreated) {
            try {
                $rootConnection->exec(sprintf(
                    "DROP USER IF EXISTS %s@'%%'",
                    $rootConnection->quote($username)
                ));
            } catch (Throwable) {
                // Best effort rollback.
            }
        }

        if ($databaseCreated) {
            try {
                $rootConnection->exec(sprintf(
                    'DROP DATABASE IF EXISTS %s',
                    $this->quoteIdentifier($database)
                ));
            } catch (Throwable) {
                // Best effort rollback.
            }
        }
    }

    private function assertIdentifier(string $identifier): string
    {
        if (!preg_match('/^[a-z0-9_]+$/', $identifier)) {
            throw new RuntimeException('Unsafe SQL identifier generated.');
        }

        return $identifier;
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`' . str_replace('`', '``', $identifier) . '`';
    }
}
