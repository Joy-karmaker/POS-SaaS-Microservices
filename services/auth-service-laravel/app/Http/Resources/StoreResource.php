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
            'id' => (string) data_get($this->resource, 'id', ''),
            'tenant_id' => (string) data_get($this->resource, 'tenant_id', ''),
            'name' => (string) data_get($this->resource, 'name', ''),
            'code' => (string) data_get($this->resource, 'code', ''),
            'created_at' => $createdAt instanceof DateTimeInterface
                ? $createdAt->format('Y-m-d H:i:s')
                : (string) $createdAt,
        ];
    }
}
