<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DuplicateStoreCodeException;
use App\Exceptions\StoreNotFoundException;
use App\Repositories\StoreRepository;
use App\Repositories\TenantRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use RuntimeException;

final class StoreService
{
    public function __construct(
        private readonly TenantRepository $tenantRepository,
        private readonly StoreRepository $storeRepository
    ) {
    }

    public function all(int|string|null $tenantId = null): Collection
    {
        return $this->storeRepository->all($tenantId);
    }

    public function create(int|string $tenantId, string $name, ?string $inputCode = null): object
    {
        if (!$this->tenantRepository->existsById($tenantId)) {
            throw new StoreNotFoundException('Tenant not found.');
        }

        $normalizedName = trim($name);
        if ($normalizedName === '') {
            throw new RuntimeException('Store name is required.');
        }

        $code = $this->resolveCode($tenantId, $normalizedName, $inputCode);
        $createdAt = now('UTC')->format('Y-m-d H:i:s');

        return $this->storeRepository->create([
            'tenant_id' => $tenantId,
            'name' => $normalizedName,
            'code' => $code,
            'created_at' => $createdAt,
        ]);
    }

    private function resolveCode(int|string $tenantId, string $storeName, ?string $inputCode): string
    {
        $providedCode = $this->sanitizeCode($inputCode ?? '');
        if ($providedCode !== '') {
            if ($this->storeRepository->existsByCode($tenantId, $providedCode)) {
                throw new DuplicateStoreCodeException(sprintf(
                    'Store code "%s" already exists for this tenant.',
                    $providedCode
                ));
            }

            return $providedCode;
        }

        $baseCode = $this->sanitizeCode($storeName);
        if ($baseCode === '') {
            $baseCode = 'STORE';
        }

        $baseCode = substr($baseCode, 0, 24);

        for ($attempt = 0; $attempt < 8; $attempt++) {
            $suffix = strtoupper(Str::random(6));
            $candidate = substr($baseCode . '_' . $suffix, 0, 32);

            if (!$this->storeRepository->existsByCode($tenantId, $candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException('Unable to generate unique store code.');
    }

    private function sanitizeCode(string $value): string
    {
        return Str::of($value)
            ->upper()
            ->replaceMatches('/[^A-Z0-9]+/', '_')
            ->trim('_')
            ->substr(0, 32)
            ->value();
    }
}
