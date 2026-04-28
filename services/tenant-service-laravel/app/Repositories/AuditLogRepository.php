<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\CoreSchemaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AuditLogRepository
{
    public function __construct(
        private readonly CoreSchemaService $schemaService
    ) {
    }

    public function insertEvent(array $event): void
    {
        $this->schemaService->ensureMessagingTables();

        DB::connection()->table('audit_logs')->insert([
            'event_id' => (string) ($event['event_id'] ?? ''),
            'event_type' => (string) ($event['event_type'] ?? ''),
            'tenant_id' => $event['tenant_id'] ?? null,
            'store_id' => $event['store_id'] ?? null,
            'user_id' => $event['user_id'] ?? null,
            'payload_json' => json_encode($event['payload'] ?? [], JSON_THROW_ON_ERROR),
            'created_at' => now('UTC')->format('Y-m-d H:i:s'),
        ]);
    }
}
