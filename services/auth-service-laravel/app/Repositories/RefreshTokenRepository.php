<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Carbon\Carbon;

final class RefreshTokenRepository
{
    private const PREFIX = 'auth:rt:';

    public function create(string $userId, string $tokenHash, string $expiresAt): object
    {
        $id = (string) Str::uuid();
        $ttl = Carbon::parse($expiresAt)->diffInSeconds(now('UTC'));
        
        if ($ttl <= 0) {
            $ttl = 1;
        }

        $record = (object) [
            'id' => $id,
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'revoked_at' => null,
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ];

        $json = json_encode($record, JSON_THROW_ON_ERROR);

        Redis::setex(self::PREFIX . 'hash:' . $tokenHash, $ttl, $json);
        Redis::setex(self::PREFIX . 'id:' . $id, $ttl, $tokenHash);
        
        Redis::sadd(self::PREFIX . 'user:' . $userId, $tokenHash);
        Redis::expire(self::PREFIX . 'user:' . $userId, $ttl);

        return $record;
    }

    public function findActiveByHash(string $tokenHash): ?object
    {
        $data = Redis::get(self::PREFIX . 'hash:' . $tokenHash);
        if (!$data) {
            return null;
        }

        return json_decode($data, false);
    }

    public function revokeById(string $id): void
    {
        $hash = Redis::get(self::PREFIX . 'id:' . $id);
        if ($hash) {
            $this->revokeByHash($hash);
        }
    }

    public function revokeAllByUserId(string $userId): void
    {
        $hashes = Redis::smembers(self::PREFIX . 'user:' . $userId);
        foreach ((array) $hashes as $hash) {
            $this->revokeByHash((string) $hash);
        }
        Redis::del(self::PREFIX . 'user:' . $userId);
    }

    public function revokeByHashForUser(string $userId, string $tokenHash): void
    {
        $this->revokeByHash($tokenHash);
    }

    private function revokeByHash(string $hash): void
    {
        $data = Redis::get(self::PREFIX . 'hash:' . $hash);
        if ($data) {
            $record = json_decode($data, false);
            Redis::del(self::PREFIX . 'id:' . $record->id);
            Redis::srem(self::PREFIX . 'user:' . $record->user_id, $hash);
        }
        Redis::del(self::PREFIX . 'hash:' . $hash);
    }
}
