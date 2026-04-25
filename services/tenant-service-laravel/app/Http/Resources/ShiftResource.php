<?php

declare(strict_types=1);

namespace App\Http\Resources;

use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) data_get($this->resource, 'id', ''),
            'tenant_id' => (string) data_get($this->resource, 'tenant_id', ''),
            'store_id' => (string) data_get($this->resource, 'store_id', ''),
            'user_id' => (string) data_get($this->resource, 'user_id', ''),
            'opening_balance' => $this->formatMoney(data_get($this->resource, 'opening_balance'), false),
            'closing_balance' => $this->formatMoney(data_get($this->resource, 'closing_balance'), true),
            'opened_at' => $this->formatDate(data_get($this->resource, 'opened_at')),
            'closed_at' => $this->formatDate(data_get($this->resource, 'closed_at')),
            'created_at' => $this->formatDate(data_get($this->resource, 'created_at')),
            'status' => data_get($this->resource, 'closed_at') === null ? 'open' : 'closed',
        ];
    }

    private function formatDate(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        $stringValue = trim((string) $value);

        return $stringValue === '' ? null : $stringValue;
    }

    private function formatMoney(mixed $value, bool $allowNull): ?string
    {
        if ($value === null || $value === '') {
            return $allowNull ? null : '0.00';
        }

        return is_numeric($value)
            ? number_format((float) $value, 2, '.', '')
            : (string) $value;
    }
}
