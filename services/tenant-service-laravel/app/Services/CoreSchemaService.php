<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

final class CoreSchemaService
{
    private bool $messagingEnsured = false;

    public function ensureMessagingTables(): void
    {
        if ($this->messagingEnsured) {
            return;
        }

        if (!Schema::hasTable('processed_events')) {
            Schema::create('processed_events', function (Blueprint $table): void {
                $table->string('event_id', 64);
                $table->string('consumer', 64);
                $table->timestamp('processed_at')->useCurrent();
                $table->primary(['event_id', 'consumer'], 'pk_processed_events');
            });
        }

        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table): void {
                $table->id();
                $table->string('event_id', 64)->unique();
                $table->string('event_type', 128);
                $table->unsignedBigInteger('tenant_id')->nullable();
                $table->unsignedBigInteger('store_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->longText('payload_json');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        $this->messagingEnsured = true;
    }
}
