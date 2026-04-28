<?php

declare(strict_types=1);

namespace App\Services\TenantProvisioning;

use Illuminate\Support\Str;
use RuntimeException;

final class TenantProvisioningPayloadFactory
{
    public function make(string $name): array
    {
        $tenantName = trim($name);
        if ($tenantName === '') {
            throw new RuntimeException('Tenant name is required.');
        }

        // We use a random suffix for database/user names to avoid collisions
        $suffix = Str::lower(Str::random(6));

        return [
            'name' => $tenantName,
            'db_name' => $this->buildDatabaseName($tenantName, $suffix),
            'db_username' => $this->buildDatabaseUser($tenantName, $suffix),
            'db_password' => Str::random(24),
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ];
    }

    private function buildDatabaseName(string $tenantName, string $suffix): string
    {
        $slug = $this->sanitizeTenantSlug($tenantName);
        $maxSlugLength = 64 - 1 - strlen($suffix); // db_name max 64 chars
        $slug = $this->truncateSlug($slug, $maxSlugLength);

        return $this->assertIdentifier($slug . '_' . $suffix);
    }

    private function buildDatabaseUser(string $tenantName, string $suffix): string
    {
        $slug = $this->sanitizeTenantSlug($tenantName);
        $maxSlugLength = 32 - 3 - strlen($suffix); // mysql username max 32 chars
        $slug = $this->truncateSlug($slug, $maxSlugLength);

        return $this->assertIdentifier($slug . '_u_' . $suffix);
    }

    private function sanitizeTenantSlug(string $tenantName): string
    {
        $slug = Str::of($tenantName)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->value();

        return $slug !== '' ? $slug : 'shop';
    }

    private function truncateSlug(string $slug, int $maxLength): string
    {
        if ($maxLength < 1) {
            return 'shop';
        }

        $truncated = trim(substr($slug, 0, $maxLength), '_');

        return $truncated !== '' ? $truncated : 'shop';
    }

    private function assertIdentifier(string $identifier): string
    {
        if (!preg_match('/^[a-z0-9_]+$/', $identifier)) {
            throw new RuntimeException('Unsafe SQL identifier generated.');
        }

        return $identifier;
    }
}
