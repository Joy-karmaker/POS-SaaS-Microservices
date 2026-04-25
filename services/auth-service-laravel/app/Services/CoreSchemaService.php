<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

final class CoreSchemaService
{
    private bool $storesEnsured = false;
    private bool $shiftsEnsured = false;
    private bool $messagingEnsured = false;

    public function ensureStoresTable(): void
    {
        if ($this->storesEnsured) {
            return;
        }

        if (!Schema::hasTable('stores')) {
            Schema::create('stores', function (Blueprint $table): void {
                $table->char('id', 36)->primary();
                $table->char('tenant_id', 36);
                $table->string('name', 255);
                $table->string('code', 32);
                $table->timestamp('created_at')->useCurrent();

                $table->unique(['tenant_id', 'code'], 'uniq_stores_tenant_code');
                $table->foreign('tenant_id', 'fk_stores_tenant')
                    ->references('id')
                    ->on('tenants')
                    ->cascadeOnDelete();
            });
        }

        $this->storesEnsured = true;
    }

    public function ensureShiftsTable(): void
    {
        if ($this->shiftsEnsured) {
            return;
        }

        $this->ensureStoresTable();

        if (!Schema::hasTable('shifts')) {
            Schema::create('shifts', function (Blueprint $table): void {
                $table->char('id', 36)->primary();
                $table->char('tenant_id', 36);
                $table->char('store_id', 36);
                $table->char('user_id', 36);
                $table->decimal('opening_balance', 12, 2)->default(0);
                $table->decimal('closing_balance', 12, 2)->nullable();
                $table->timestamp('opened_at');
                $table->timestamp('closed_at')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(
                    ['tenant_id', 'store_id', 'user_id', 'closed_at'],
                    'idx_shifts_tenant_store_user_open'
                );
                $table->foreign('tenant_id', 'fk_shifts_tenant')
                    ->references('id')
                    ->on('tenants')
                    ->cascadeOnDelete();
                $table->foreign('store_id', 'fk_shifts_store')
                    ->references('id')
                    ->on('stores')
                    ->cascadeOnDelete();
                $table->foreign('user_id', 'fk_shifts_user')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();
            });
        }

        $this->shiftsEnsured = true;
    }

    public function ensureMessagingTables(): void
    {
        if ($this->messagingEnsured) {
            return;
        }

        if (!Schema::hasTable('processed_events')) {
            Schema::create('processed_events', function (Blueprint $table): void {
                $table->char('event_id', 36);
                $table->string('consumer', 64);
                $table->timestamp('processed_at')->useCurrent();
                $table->primary(['event_id', 'consumer'], 'pk_processed_events');
            });
        }

        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table): void {
                $table->char('id', 36)->primary();
                $table->char('event_id', 36)->unique();
                $table->string('event_type', 128);
                $table->char('tenant_id', 36)->nullable();
                $table->char('store_id', 36)->nullable();
                $table->char('user_id', 36)->nullable();
                $table->longText('payload_json');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        $this->messagingEnsured = true;
    }
}
