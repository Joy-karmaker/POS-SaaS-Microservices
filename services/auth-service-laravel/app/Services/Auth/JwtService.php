<?php

declare(strict_types=1);

namespace App\Services\Auth;

use Illuminate\Support\Str;
use RuntimeException;

final class JwtService
{
    public function issueAccessToken(array $user): array
    {
        $issuedAt = now('UTC')->timestamp;
        $expiresIn = (int) config('auth_jwt.access_ttl_seconds', 3600);

        if ($expiresIn < 60) {
            $expiresIn = 3600;
        }

        $payload = [
            'sub' => (string) ($user['id'] ?? ''),
            'role' => (string) ($user['role'] ?? ''),
            'tenant_id' => $user['tenant_id'] ?? null,
            'store_id' => null,
            'jti' => (string) Str::uuid(),
            'iat' => $issuedAt,
            'exp' => $issuedAt + $expiresIn,
            'iss' => (string) config('auth_jwt.issuer', 'pos-auth'),
            'aud' => (string) config('auth_jwt.audience', 'pos-clients'),
        ];

        return [
            'token' => $this->encode($payload),
            'expires_in' => $expiresIn,
            'claims' => $payload,
        ];
    }

    public function decodeAndValidate(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new RuntimeException('Invalid token format.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        $expectedSignature = $this->base64UrlEncode(hash_hmac(
            'sha256',
            $encodedHeader . '.' . $encodedPayload,
            $this->secret(),
            true
        ));

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            throw new RuntimeException('Token signature mismatch.');
        }

        $payloadJson = $this->base64UrlDecode($encodedPayload);
        if ($payloadJson === '') {
            throw new RuntimeException('Token payload is empty.');
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            throw new RuntimeException('Token payload is invalid JSON.');
        }

        $now = now('UTC')->timestamp;
        $exp = (int) ($payload['exp'] ?? 0);

        if ($exp <= $now) {
            throw new RuntimeException('Token expired.');
        }

        $issuer = (string) ($payload['iss'] ?? '');
        $audience = (string) ($payload['aud'] ?? '');

        if ($issuer !== (string) config('auth_jwt.issuer', 'pos-auth')) {
            throw new RuntimeException('Token issuer mismatch.');
        }

        if ($audience !== (string) config('auth_jwt.audience', 'pos-clients')) {
            throw new RuntimeException('Token audience mismatch.');
        }

        return $payload;
    }

    private function encode(array $payload): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = hash_hmac(
            'sha256',
            $encodedHeader . '.' . $encodedPayload,
            $this->secret(),
            true
        );
        $encodedSignature = $this->base64UrlEncode($signature);

        return implode('.', [$encodedHeader, $encodedPayload, $encodedSignature]);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = 4 - (strlen($value) % 4);
        if ($padding < 4) {
            $value .= str_repeat('=', $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return $decoded === false ? '' : $decoded;
    }

    private function secret(): string
    {
        $secret = (string) config('auth_jwt.secret', '');

        if (trim($secret) === '') {
            throw new RuntimeException('AUTH_JWT_SECRET is not configured.');
        }

        return $secret;
    }
}
