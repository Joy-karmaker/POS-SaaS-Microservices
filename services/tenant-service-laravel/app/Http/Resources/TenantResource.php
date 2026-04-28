<?php

declare(strict_types=1);

namespace App\Http\Resources;

use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $createdAt = data_get($this->resource, 'created_at');

        return [
            'id' => (int) data_get($this->resource, 'id', 0),
            'name' => (string) data_get($this->resource, 'name', ''),
            'db_name' => (string) data_get($this->resource, 'db_name', ''),
            'db_username' => (string) data_get($this->resource, 'db_username', ''),
            'created_at' => $createdAt instanceof DateTimeInterface
                ? $createdAt->format('Y-m-d H:i:s')
                : (string) $createdAt,
        ];
    }
}
