<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Carbon\Carbon;

final class RefreshTokenRepository
{
    private const PREFIX = 'auth:rt:';

    public function create(string $userId, string $tokenHash, string $expiresAt, int $ttl): object
    {
        $id = (string) Str::uuid();

        $record = (object) [
            'id' => $id,
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'revoked_at' => null,
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ];

        $json = json_encode($record, JSON_THROW_ON_ERROR);

        Redis::connection()->setex(self::PREFIX . 'hash:' . $tokenHash, $ttl, $json);
        Redis::connection()->setex(self::PREFIX . 'id:' . $id, $ttl, $tokenHash);
        
        Redis::connection()->sadd(self::PREFIX . 'user:' . $userId, $tokenHash);
        Redis::connection()->expire(self::PREFIX . 'user:' . $userId, $ttl);

        return $record;
    }

    public function findActiveByHash(string $tokenHash): ?object
    {
        $data = Redis::connection()->get(self::PREFIX . 'hash:' . $tokenHash);
        if (!$data) {
            return null;
        }

        return json_decode((string) $data, false);
    }

    public function revokeById(string $id): void
    {
        $hash = Redis::connection()->get(self::PREFIX . 'id:' . $id);
        if ($hash) {
            $this->revokeByHash((string) $hash);
        }
    }

    public function revokeAllByUserId(string $userId): void
    {
        $hashes = Redis::connection()->smembers(self::PREFIX . 'user:' . $userId);
        foreach ((array) $hashes as $hash) {
            $this->revokeByHash((string) $hash);
        }
        Redis::connection()->del(self::PREFIX . 'user:' . $userId);
    }

    public function revokeByHashForUser(string $userId, string $tokenHash): void
    {
        $this->revokeByHash($tokenHash);
    }

    private function revokeByHash(string $hash): void
    {
        $data = Redis::connection()->get(self::PREFIX . 'hash:' . $hash);
        if ($data) {
            $record = json_decode((string) $data, false);
            Redis::connection()->del(self::PREFIX . 'id:' . $record->id);
            Redis::connection()->srem(self::PREFIX . 'user:' . $record->user_id, $hash);
        }
        Redis::connection()->del(self::PREFIX . 'hash:' . $hash);
    }
}
