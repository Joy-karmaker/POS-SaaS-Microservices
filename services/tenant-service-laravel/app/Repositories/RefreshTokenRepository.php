<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RefreshTokenRepository
{
    public function create(string $userId, string $tokenHash, string $expiresAt): object
    {
        $record = (object) [
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'revoked_at' => null,
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ];

        DB::connection()->table('auth_refresh_tokens')->insert([
            'id' => $record->id,
            'user_id' => $record->user_id,
            'token_hash' => $record->token_hash,
            'expires_at' => $record->expires_at,
            'revoked_at' => $record->revoked_at,
            'created_at' => $record->created_at,
        ]);

        return $record;
    }

    public function findActiveByHash(string $tokenHash): ?object
    {
        return DB::connection()
            ->table('auth_refresh_tokens')
            ->select(['id', 'user_id', 'token_hash', 'expires_at', 'revoked_at', 'created_at'])
            ->where('token_hash', $tokenHash)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now('UTC')->format('Y-m-d H:i:s'))
            ->first();
    }

    public function revokeById(string $id): void
    {
        DB::connection()
            ->table('auth_refresh_tokens')
            ->where('id', $id)
            ->whereNull('revoked_at')
            ->update([
                'revoked_at' => now('UTC')->format('Y-m-d H:i:s'),
            ]);
    }

    public function revokeAllByUserId(string $userId): void
    {
        DB::connection()
            ->table('auth_refresh_tokens')
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update([
                'revoked_at' => now('UTC')->format('Y-m-d H:i:s'),
            ]);
    }

    public function revokeByHashForUser(string $userId, string $tokenHash): void
    {
        DB::connection()
            ->table('auth_refresh_tokens')
            ->where('user_id', $userId)
            ->where('token_hash', $tokenHash)
            ->whereNull('revoked_at')
            ->update([
                'revoked_at' => now('UTC')->format('Y-m-d H:i:s'),
            ]);
    }
}
