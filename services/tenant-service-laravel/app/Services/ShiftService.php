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
        int|string $tenantId,
        int|string $userId,
        int|string $storeId,
        mixed $openingBalance = null
    ): object {
        $this->assertStoreBelongsToTenant($tenantId, $storeId);

        $activeShift = $this->shiftRepository->findActiveForUserStore($tenantId, $userId, $storeId);
        if ($activeShift !== null) {
            throw new ActiveShiftExistsException('An active shift already exists for this store.');
        }

        $openedAt = now('UTC')->format('Y-m-d H:i:s');

        return $this->shiftRepository->create([
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
        int|string $tenantId,
        int|string $userId,
        int|string $storeId,
        mixed $closingBalance = null
    ): object {
        $this->assertStoreBelongsToTenant($tenantId, $storeId);

        $activeShift = $this->shiftRepository->findActiveForUserStore($tenantId, $userId, $storeId);
        if ($activeShift === null) {
            throw new ActiveShiftNotFoundException('No active shift found for this store.');
        }

        $closedAt = now('UTC')->format('Y-m-d H:i:s');
        $this->shiftRepository->closeById(
            $activeShift->id,
            $tenantId,
            $closedAt,
            $this->formatMoney($closingBalance, true)
        );

        $updatedShift = $this->shiftRepository->findById($activeShift->id);

        $finalShift = $updatedShift ?? $activeShift;
        $this->shiftClosedPublisher->publish($finalShift);

        return $finalShift;
    }

    public function current(int|string $tenantId, int|string $userId, int|string $storeId): ?object
    {
        $this->assertStoreBelongsToTenant($tenantId, $storeId);

        return $this->shiftRepository->findActiveForUserStore($tenantId, $userId, $storeId);
    }

    private function assertStoreBelongsToTenant(int|string $tenantId, int|string $storeId): void
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
