docker compose exec tenant-service php artisan rabbitmq:consume-shift-closed

# Session Log - April 3, 2026

## Scope

- Implement RabbitMQ event flow for `ShiftClosed`.
- Publish event when shift is closed.
- Consume event into audit storage with idempotency and DLQ support.

## What We Implemented

1. RabbitMQ dependency
- Added `php-amqplib/php-amqplib` to:
  - `services/tenant-service-laravel/composer.json`

2. Publisher side (Producer)
- Added RabbitMQ config:
  - `services/tenant-service-laravel/config/rabbitmq.php`
- Added connection and topology services:
  - `app/Services/Messaging/RabbitMqConnectionFactory.php`
  - `app/Services/Messaging/RabbitMqTopologyService.php`
- Added event publisher:
  - `app/Services/Messaging/ShiftClosedPublisher.php`
- Hooked publish into shift close flow:
  - `app/Services/ShiftService.php`

3. Consumer side
- Added command:
  - `app/Console/Commands/ConsumeShiftClosedCommand.php`
- Registered command auto-discovery path:
  - `bootstrap/app.php` (`withCommands`)
- Command name:
  - `rabbitmq:consume-shift-closed`

4. Idempotency and audit persistence
- Added repositories:
  - `app/Repositories/ProcessedEventRepository.php`
  - `app/Repositories/AuditLogRepository.php`
- Added schema runtime guard for messaging tables:
  - `app/Services/CoreSchemaService.php` (`ensureMessagingTables`)
- Added MySQL init tables:
  - `infra/mysql/init/001-control-plane.sql`
  - Tables:
    - `processed_events`
    - `audit_logs`

5. Environment and Docker wiring
- Added RabbitMQ env variables in:
  - `services/tenant-service-laravel/.env`
  - `services/tenant-service-laravel/.env.example`
  - `.env`
  - `.env.example`
- Added tenant-service RabbitMQ env mapping and startup dependency in:
  - `docker-compose.yml`

6. Documentation
- Added RabbitMQ ShiftClosed section to:
  - `README.md`

## Process Flow

1. Client calls `POST /tenant/shifts/close`.
2. `ShiftService` closes shift in DB.
3. `ShiftClosedPublisher` publishes `shift.closed.v1` to exchange `pos.events` with routing key `shift.closed`.
4. Consumer command reads from queue `audit.shift.closed`.
5. Consumer checks `processed_events` by (`event_id`, `consumer`):
- already processed -> ack + skip
- not processed -> insert `audit_logs`, mark processed, ack
6. If processing fails -> message rejected and routed to DLQ `audit.shift.closed.dlq`.

## Event Contract (Current)

```json
{
  "event_id": "uuid",
  "event_type": "shift.closed.v1",
  "occurred_at": "ISO-8601",
  "tenant_id": "uuid",
  "store_id": "uuid",
  "user_id": "uuid",
  "payload": {
    "shift_id": "uuid",
    "opening_balance": "1000.00",
    "closing_balance": "1200.50",
    "opened_at": "YYYY-MM-DD HH:MM:SS",
    "closed_at": "YYYY-MM-DD HH:MM:SS"
  }
}
```

## Commands

Start consumer:

```powershell
cd services/tenant-service-laravel
php artisan rabbitmq:consume-shift-closed
```

Consume one message only:

```powershell
php artisan rabbitmq:consume-shift-closed --once
```

## Runtime Issues Faced (2 Times)

### Issue 1

- Error:
  - `Call to undefined method PhpAmqpLib\Channel\AMQPChannel::is_consuming()`
- Root cause:
  - `php-amqplib` v2.8 does not expose `is_consuming()` like newer versions.
- Fix:
  - Updated consumer loop to support both versions:
    - check `is_consuming()` when available
    - fallback to callback-based consumer detection.

### Issue 2

- Error:
  - `ShiftClosed consumer failed: Error receiving data`
  - Follow-up internal constant issue:
    - `Undefined constant PhpAmqpLib\Wire\IO\SOCKET_EAGAIN`
- Root cause:
  - Long-running connection stability edge cases in local setup.
  - `php-amqplib` v2 references socket constants and can hit runtime issues in this environment.
- Fix:
  - Added consumer heartbeat/timeout + reconnect handling.
  - Added safe fallback definitions for socket constants in connection factory.
  - Updated RabbitMQ env defaults for stability:
    - `RABBITMQ_KEEPALIVE=false`
    - heartbeat and read/write timeout config.
  - Rebuilt/restarted `tenant-service` container to apply runtime changes.

## Verification

- Backend tests:
  - `php artisan test` -> passed (`27` tests).
- Command registration:
  - `php artisan list` shows `rabbitmq:consume-shift-closed`.

## Notes

- `ShiftClosedPublisher` skips publish in `testing` env to keep tests deterministic.
- In local/prod-like env, publish errors are logged; set `RABBITMQ_PUBLISH_FAIL_HARD=true` to fail hard.
