<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ActiveShiftExistsException;
use App\Exceptions\ActiveShiftNotFoundException;
use App\Exceptions\StoreNotFoundException;
use App\Repositories\ShiftRepository;
use App\Repositories\StoreRepository;
use App\Services\Messaging\ShiftClosedPublisher;
use Illuminate\Support\Str;

final class ShiftService
{
    public function __construct(
        private readonly StoreRepository $storeRepository,
        private readonly ShiftRepository $shiftRepository,
        private readonly ShiftClosedPublisher $shiftClosedPublisher
    ) {
    }

    public function open(
        string $tenantId,
        string $userId,
        string $storeId,
        mixed $openingBalance = null
    ): object {
        $this->assertStoreBelongsToTenant($tenantId, $storeId);

        $activeShift = $this->shiftRepository->findActiveForUserStore($tenantId, $userId, $storeId);
        if ($activeShift !== null) {
            throw new ActiveShiftExistsException('An active shift already exists for this store.');
        }

        $openedAt = now('UTC')->format('Y-m-d H:i:s');

        return $this->shiftRepository->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'store_id' => $storeId,
            'user_id' => $userId,
            'opening_balance' => $this->formatMoney($openingBalance, false),
            'closing_balance' => null,
            'opened_at' => $openedAt,
            'closed_at' => null,
            'created_at' => $openedAt,
        ]);
    }

    public function close(
        string $tenantId,
        string $userId,
        string $storeId,
        mixed $closingBalance = null
    ): object {
        $this->assertStoreBelongsToTenant($tenantId, $storeId);

        $activeShift = $this->shiftRepository->findActiveForUserStore($tenantId, $userId, $storeId);
        if ($activeShift === null) {
            throw new ActiveShiftNotFoundException('No active shift found for this store.');
        }

        $closedAt = now('UTC')->format('Y-m-d H:i:s');
        $this->shiftRepository->closeById(
            (string) $activeShift->id,
            $closedAt,
            $this->formatMoney($closingBalance, true)
        );

        $updatedShift = $this->shiftRepository->findById((string) $activeShift->id);

        $finalShift = $updatedShift ?? $activeShift;
        $this->shiftClosedPublisher->publish($finalShift);

        return $finalShift;
    }

    public function current(string $tenantId, string $userId, string $storeId): ?object
    {
        $this->assertStoreBelongsToTenant($tenantId, $storeId);

        return $this->shiftRepository->findActiveForUserStore($tenantId, $userId, $storeId);
    }

    private function assertStoreBelongsToTenant(string $tenantId, string $storeId): void
    {
        $store = $this->storeRepository->findByIdForTenant($storeId, $tenantId);
        if ($store === null) {
            throw new StoreNotFoundException('Store not found for current tenant.');
        }
    }

    private function formatMoney(mixed $value, bool $allowNull): ?string
    {
        if ($value === null || $value === '') {
            return $allowNull ? null : '0.00';
        }

        return number_format((float) $value, 2, '.', '');
    }
}
