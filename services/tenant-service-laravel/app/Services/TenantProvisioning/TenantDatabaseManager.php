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
        $connection = config('database.connections.pgsql');
        $host = (string) ($connection['host'] ?? '127.0.0.1');
        $port = (int) ($connection['port'] ?? 5432);
        $username = (string) ($connection['username'] ?? 'postgres');
        $password = (string) ($connection['password'] ?? '');

        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=postgres', $host, $port);

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
            'CREATE DATABASE %s',
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
            'CREATE USER %s WITH PASSWORD %s',
            $this->quoteIdentifier($username),
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
            'GRANT ALL PRIVILEGES ON DATABASE %s TO %s',
            $this->quoteIdentifier($database),
            $this->quoteIdentifier($username)
        ));

        $connection = config('database.connections.pgsql');
        $host = (string) ($connection['host'] ?? '127.0.0.1');
        $port = (int) ($connection['port'] ?? 5432);
        $rootUsername = (string) ($connection['username'] ?? 'postgres');
        $rootPassword = (string) ($connection['password'] ?? '');

        $tenantDatabaseConnection = new PDO(
            sprintf('pgsql:host=%s;port=%d;dbname=%s', $host, $port, $database),
            $rootUsername,
            $rootPassword,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $tenantDatabaseConnection->exec(sprintf(
            'GRANT USAGE, CREATE ON SCHEMA public TO %s',
            $this->quoteIdentifier($username)
        ));
    }

    public function tenantConnection(
        string $databaseName,
        string $databaseUser,
        string $databasePassword
    ): PDO {
        $database = $this->assertIdentifier($databaseName);

        $connection = config('database.connections.pgsql');
        $host = (string) ($connection['host'] ?? '127.0.0.1');
        $port = (int) ($connection['port'] ?? 5432);

        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s',
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

        if ($databaseCreated) {
            try {
                $rootConnection->exec(sprintf(
                    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()',
                    $rootConnection->quote($database)
                ));
                $rootConnection->exec(sprintf(
                    'DROP DATABASE IF EXISTS %s',
                    $this->quoteIdentifier($database)
                ));
            } catch (Throwable) {
                // Best effort rollback.
            }
        }

        if ($userCreated) {
            try {
                $rootConnection->exec(sprintf(
                    'DROP USER IF EXISTS %s',
                    $this->quoteIdentifier($username)
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
        return '"' . str_replace('"', '""', $identifier) . '"';
    }
}
