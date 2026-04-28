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
        $openedAt = data_get($this->resource, 'opened_at');
        $closedAt = data_get($this->resource, 'closed_at');
        $createdAt = data_get($this->resource, 'created_at');

        return [
            'id' => (int) data_get($this->resource, 'id', 0),
            'tenant_id' => (int) data_get($this->resource, 'tenant_id', 0),
            'store_id' => (int) data_get($this->resource, 'store_id', 0),
            'user_id' => (int) data_get($this->resource, 'user_id', 0),
            'opening_balance' => (float) data_get($this->resource, 'opening_balance', 0),
            'closing_balance' => data_get($this->resource, 'closing_balance') !== null 
                ? (float) $this->resource->closing_balance 
                : null,
            'opened_at' => $openedAt instanceof DateTimeInterface
                ? $openedAt->format('Y-m-d H:i:s')
                : (string) $openedAt,
            'closed_at' => $closedAt instanceof DateTimeInterface
                ? $closedAt->format('Y-m-d H:i:s')
                : (string) $closedAt,
            'created_at' => $createdAt instanceof DateTimeInterface
                ? $createdAt->format('Y-m-d H:i:s')
                : (string) $createdAt,
        ];
    }
}
