<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Repositories\RefreshTokenRepository;
use Illuminate\Support\Str;
use RuntimeException;

final class RefreshTokenService
{
    public function __construct(
        private readonly RefreshTokenRepository $refreshTokenRepository
    ) {
    }

    public function issue(string $userId): array
    {
        $ttl = (int) config('auth_jwt.refresh_ttl_seconds', 1209600);
        if ($ttl < 300) {
            $ttl = 1209600;
        }

        $plainToken = $this->generateToken();
        $expiresAt = now('UTC')->addSeconds($ttl)->format('Y-m-d H:i:s');

        $this->refreshTokenRepository->create(
            $userId,
            $this->hashToken($plainToken),
            $expiresAt,
            $ttl
        );

        return [
            'token' => $plainToken,
            'expires_in' => $ttl,
            'expires_at' => $expiresAt,
        ];
    }

    public function findActive(string $plainToken): ?object
    {
        if (trim($plainToken) === '') {
            return null;
        }

        return $this->refreshTokenRepository->findActiveByHash(
            $this->hashToken($plainToken)
        );
    }

    public function revokeById(string $id): void
    {
        $this->refreshTokenRepository->revokeById($id);
    }

    public function revokeAllForUser(string $userId): void
    {
        $this->refreshTokenRepository->revokeAllByUserId($userId);
    }

    public function revokeForUserToken(string $userId, string $plainToken): void
    {
        if (trim($plainToken) === '') {
            return;
        }

        $this->refreshTokenRepository->revokeByHashForUser(
            $userId,
            $this->hashToken($plainToken)
        );
    }

    private function generateToken(): string
    {
        $token = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=')
            . '.'
            . Str::random(32);

        if (trim($token) === '') {
            throw new RuntimeException('Failed to generate refresh token.');
        }

        return $token;
    }

    private function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }
}
