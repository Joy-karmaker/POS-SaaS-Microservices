<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\CoreSchemaService;
use Illuminate\Support\Facades\DB;

final class ShiftRepository
{
    public function __construct(
        private readonly CoreSchemaService $schemaService
    ) {
    }

    public function create(array $payload): object
    {
        $this->schemaService->ensureShiftsTable();

        DB::connection()->table('shifts')->insert($payload);

        return (object) $payload;
    }

    public function findById(string $shiftId): ?object
    {
        $this->schemaService->ensureShiftsTable();

        return DB::connection()
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

    public function findActiveForUserStore(string $tenantId, string $userId, string $storeId): ?object
    {
        $this->schemaService->ensureShiftsTable();

        return DB::connection()
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

    public function closeById(string $shiftId, string $closedAt, ?string $closingBalance): void
    {
        $this->schemaService->ensureShiftsTable();

        DB::connection()
            ->table('shifts')
            ->where('id', $shiftId)
            ->update([
                'closed_at' => $closedAt,
                'closing_balance' => $closingBalance,
            ]);
    }
}
