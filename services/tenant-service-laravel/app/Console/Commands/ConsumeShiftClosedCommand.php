<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Repositories\AuditLogRepository;
use App\Repositories\ProcessedEventRepository;
use App\Services\Messaging\RabbitMqConnectionFactory;
use App\Services\Messaging\RabbitMqTopologyService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpAmqpLib\Exception\AMQPTimeoutException;
use PhpAmqpLib\Message\AMQPMessage;
use Throwable;

final class ConsumeShiftClosedCommand extends Command
{
    protected $signature = 'rabbitmq:consume-shift-closed
        {--once : Consume a single message and stop}
        {--max=0 : Max number of messages to consume before stopping (0 = unlimited)}';

    protected $description = 'Consume shift.closed events and write audit logs with idempotency.';

    private const CONSUMER_NAME = 'shift_closed_audit_v1';

    public function __construct(
        private readonly RabbitMqConnectionFactory $connectionFactory,
        private readonly RabbitMqTopologyService $topologyService,
        private readonly ProcessedEventRepository $processedEventRepository,
        private readonly AuditLogRepository $auditLogRepository
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        try {
            $connection = $this->connectionFactory->make();
            $channel = $connection->channel();

            try {
                $this->topologyService->declareShiftClosedTopology($channel);
                $channel->basic_qos(0, 1, false);

                if ((bool) $this->option('once')) {
                    return $this->consumeOne($channel) ? self::SUCCESS : self::FAILURE;
                }
            } finally {
                try {
                    $channel->close();
                } catch (Throwable) {
                    // no-op
                }
                try {
                    $connection->close();
                } catch (Throwable) {
                    // no-op
                }
            }

            return $this->consumeContinuously(max(0, (int) $this->option('max')));
        } catch (Throwable $exception) {
            $this->error('ShiftClosed consumer failed: ' . $exception->getMessage());

            Log::error('ShiftClosed consumer command failed.', [
                'error' => $exception->getMessage(),
            ]);

            return self::FAILURE;
        }
    }

    private function consumeOne($channel): bool
    {
        $queue = (string) config('rabbitmq.queues.shift_closed_audit', 'audit.shift.closed');
        $message = $channel->basic_get($queue, false);

        if ($message === null) {
            $this->warn('No message available in queue.');

            return true;
        }

        $ok = $this->processMessage($message);
        if ($ok) {
            $this->info('Processed one shift.closed event.');
        } else {
            $this->warn('Message moved to DLQ or skipped due to invalid payload.');
        }

        return $ok;
    }

    private function processMessage(AMQPMessage $message): bool
    {
        $deliveryTag = $message->delivery_info['delivery_tag'];
        $channel = $message->delivery_info['channel'];

        try {
            $payload = json_decode($message->body, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            Log::warning('Invalid JSON payload in shift.closed queue.', [
                'error' => $exception->getMessage(),
            ]);

            $channel->basic_ack($deliveryTag);

            return false;
        }

        $eventId = trim((string) ($payload['event_id'] ?? ''));
        if ($eventId === '') {
            Log::warning('Missing event_id in shift.closed payload.');
            $channel->basic_ack($deliveryTag);

            return false;
        }

        if ($this->processedEventRepository->exists($eventId, self::CONSUMER_NAME)) {
            $channel->basic_ack($deliveryTag);

            return true;
        }

        try {
            DB::transaction(function () use ($payload, $eventId): void {
                $this->auditLogRepository->insertEvent($payload);
                $this->processedEventRepository->markProcessed($eventId, self::CONSUMER_NAME);
            });

            $channel->basic_ack($deliveryTag);

            return true;
        } catch (Throwable $exception) {
            Log::error('Failed processing shift.closed event.', [
                'event_id' => $eventId,
                'error' => $exception->getMessage(),
            ]);

            $channel->basic_reject($deliveryTag, false);

            return false;
        }
    }

    private function hasActiveConsumers(object $channel): bool
    {
        if (method_exists($channel, 'is_consuming')) {
            return (bool) $channel->is_consuming();
        }

        if (property_exists($channel, 'callbacks')) {
            $callbacks = $channel->callbacks;

            return is_array($callbacks) && count($callbacks) > 0;
        }

        return true;
    }

    private function consumeContinuously(int $max): int
    {
        $processed = 0;
        $keepConsuming = true;
        $reconnectAttempts = 0;
        $maxReconnectAttempts = 20;
        $queue = (string) config('rabbitmq.queues.shift_closed_audit', 'audit.shift.closed');
        $printedStart = false;

        while ($keepConsuming) {
            $connection = null;
            $channel = null;

            try {
                $connection = $this->connectionFactory->make();
                $channel = $connection->channel();

                $this->topologyService->declareShiftClosedTopology($channel);
                $channel->basic_qos(0, 1, false);

                if (!$printedStart) {
                    $this->info(sprintf('Consuming queue "%s"...', $queue));
                    $printedStart = true;
                }

                $channel->basic_consume(
                    $queue,
                    '',
                    false,
                    false,
                    false,
                    false,
                    function (AMQPMessage $message) use (&$processed, $max, &$keepConsuming): void {
                        $ok = $this->processMessage($message);
                        $processed++;

                        if ($ok) {
                            $this->line('Processed shift.closed event.');
                        } else {
                            $this->warn('Message moved to DLQ or skipped due to invalid payload.');
                        }

                        if ($max > 0 && $processed >= $max) {
                            $keepConsuming = false;
                            $message->delivery_info['channel']->basic_cancel(
                                $message->delivery_info['consumer_tag']
                            );
                        }
                    }
                );

                while ($keepConsuming && $this->hasActiveConsumers($channel)) {
                    try {
                        $channel->wait(null, false, 5);
                    } catch (AMQPTimeoutException) {
                        $this->touchHeartbeat($connection);
                    }
                }

                return self::SUCCESS;
            } catch (Throwable $exception) {
                if (
                    $keepConsuming
                    && $this->isRecoverableConnectionError($exception)
                    && $reconnectAttempts < $maxReconnectAttempts
                ) {
                    $reconnectAttempts++;

                    $this->warn(sprintf(
                        'RabbitMQ connection interrupted (%s). Reconnecting %d/%d...',
                        $exception->getMessage(),
                        $reconnectAttempts,
                        $maxReconnectAttempts
                    ));

                    Log::warning('ShiftClosed consumer reconnecting after connection error.', [
                        'attempt' => $reconnectAttempts,
                        'max_attempts' => $maxReconnectAttempts,
                        'error' => $exception->getMessage(),
                    ]);

                    continue;
                }

                throw $exception;
            } finally {
                try {
                    if ($channel !== null) {
                        $channel->close();
                    }
                } catch (Throwable) {
                    // no-op
                }

                try {
                    if ($connection !== null) {
                        $connection->close();
                    }
                } catch (Throwable) {
                    // no-op
                }
            }
        }

        return self::SUCCESS;
    }

    private function touchHeartbeat(object $connection): void
    {
        if (!method_exists($connection, 'checkHeartBeat')) {
            return;
        }

        $connection->checkHeartBeat();
    }

    private function isRecoverableConnectionError(Throwable $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'error receiving data')
            || str_contains($message, 'broken pipe')
            || str_contains($message, 'connection closed')
            || str_contains($message, 'socket');
    }
}
