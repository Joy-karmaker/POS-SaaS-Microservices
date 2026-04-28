<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class StaffUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) data_get($this->resource, 'id', 0),
            'tenant_id' => (int) data_get($this->resource, 'tenant_id', 0),
            'username' => (string) data_get($this->resource, 'username', ''),
            'role' => (string) data_get($this->resource, 'role', 'user'),
            'created_at' => (string) data_get($this->resource, 'created_at', ''),
        ];
    }
}
