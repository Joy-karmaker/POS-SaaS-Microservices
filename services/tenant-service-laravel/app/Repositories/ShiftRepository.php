<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\TenantConnectionManager;
use Illuminate\Support\Facades\DB;

final class ShiftRepository
{
    public function __construct(
        private readonly TenantConnectionManager $connectionManager
    ) {
    }

    public function create(array $payload): object
    {
        $tenantId = $payload['tenant_id'] ?? '';
        if ($tenantId !== '') {
            $this->connectionManager->switch((string)$tenantId);
        }

        $id = DB::connection('tenant')->table('shifts')->insertGetId($payload);
        
        $payload['id'] = $id;
        return (object) $payload;
    }

    public function findById(int|string $shiftId): ?object
    {
        return DB::connection('tenant')
            ->table('shifts')
            ->select([
                'id',
                'tenant_id',
                'store_id',
                'user_id',
                'opening_balance',
                'closing_balance',
                'opened_at',
                'closed_at',
                'created_at',
            ])
            ->where('id', $shiftId)
            ->first();
    }

    public function findActiveForUserStore(int|string $tenantId, int|string $userId, int|string $storeId): ?object
    {
        $this->connectionManager->switch((string)$tenantId);

        return DB::connection('tenant')
            ->table('shifts')
            ->select([
                'id',
                'tenant_id',
                'store_id',
                'user_id',
                'opening_balance',
                'closing_balance',
                'opened_at',
                'closed_at',
                'created_at',
            ])
            ->where('tenant_id', $tenantId)
            ->where('store_id', $storeId)
            ->where('user_id', $userId)
            ->whereNull('closed_at')
            ->orderByDesc('opened_at')
            ->first();
    }

    public function closeById(int|string $shiftId, int|string $tenantId, string $closedAt, ?string $closingBalance): void
    {
        $this->connectionManager->switch((string)$tenantId);

        DB::connection('tenant')
            ->table('shifts')
            ->where('id', $shiftId)
            ->update([
                'closed_at' => $closedAt,
                'closing_balance' => $closingBalance,
            ]);
    }
}
