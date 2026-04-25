<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Services\CoreSchemaService;
use Illuminate\Support\Facades\DB;

final class ProcessedEventRepository
{
    public function __construct(
        private readonly CoreSchemaService $schemaService
    ) {
    }

    public function exists(string $eventId, string $consumer): bool
    {
        $this->schemaService->ensureMessagingTables();

        return DB::connection()
            ->table('processed_events')
            ->where('event_id', $eventId)
            ->where('consumer', $consumer)
            ->exists();
    }

    public function markProcessed(string $eventId, string $consumer): void
    {
        $this->schemaService->ensureMessagingTables();

        DB::connection()->table('processed_events')->insert([
            'event_id' => $eventId,
            'consumer' => $consumer,
            'processed_at' => now('UTC')->format('Y-m-d H:i:s'),
        ]);
    }
}
