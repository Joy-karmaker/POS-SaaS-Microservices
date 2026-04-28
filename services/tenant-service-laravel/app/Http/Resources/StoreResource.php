<?php

declare(strict_types=1);

namespace App\Http\Resources;

use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class StoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $createdAt = data_get($this->resource, 'created_at');

        return [
            'id' => (int) data_get($this->resource, 'id', 0),
            'tenant_id' => (int) data_get($this->resource, 'tenant_id', 0),
            'name' => (string) data_get($this->resource, 'name', ''),
            'code' => (string) data_get($this->resource, 'code', ''),
            'created_at' => $createdAt instanceof DateTimeInterface
                ? $createdAt->format('Y-m-d H:i:s')
                : (string) $createdAt,
        ];
    }
}
