<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) data_get($this->resource, 'id', 0),
            'tenant_id' => data_get($this->resource, 'tenant_id') !== null 
                ? (int) $this->resource->tenant_id 
                : null,
            'username' => (string) data_get($this->resource, 'username', ''),
            'role' => (string) data_get($this->resource, 'role', ''),
            'created_at' => (string) data_get($this->resource, 'created_at', ''),
        ];
    }
}
