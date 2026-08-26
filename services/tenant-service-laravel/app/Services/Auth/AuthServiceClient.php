<?php

declare(strict_types=1);

namespace App\Services\Auth;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

final class AuthServiceClient
{
    private const DEFAULT_BASE_URL = 'http://auth-service:8080';

    public function listStaff(string $accessToken, int|string $tenantId): Response
    {
        return $this->request($accessToken)->get($this->url('/staff'), [
            'tenant_id' => $tenantId,
        ]);
    }

    /** @param array{tenant_id: int|string, username?: string, password: string, role: string} $payload */
    public function createStaff(string $accessToken, array $payload): Response
    {
        return $this->request($accessToken)->post($this->url('/staff'), $payload);
    }

    private function request(string $accessToken): PendingRequest
    {
        return Http::acceptJson()
            ->withToken($accessToken)
            ->connectTimeout((int) config('services.auth_service.connect_timeout', 3))
            ->timeout((int) config('services.auth_service.timeout', 10));
    }

    private function url(string $path): string
    {
        return rtrim((string) config('services.auth_service.base_url', self::DEFAULT_BASE_URL), '/') . $path;
    }
}
