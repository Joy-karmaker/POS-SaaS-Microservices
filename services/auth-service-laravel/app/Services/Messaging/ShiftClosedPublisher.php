<?php

declare(strict_types=1);

namespace App\Services\Messaging;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpAmqpLib\Message\AMQPMessage;
use Throwable;

final class ShiftClosedPublisher
{
    public function __construct(
        private readonly RabbitMqConnectionFactory $connectionFactory,
        private readonly RabbitMqTopologyService $topologyService
    ) {
    }

    public function publish(object $shift): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $connection = null;
        $channel = null;

        try {
            $connection = $this->connectionFactory->make();
            $channel = $connection->channel();

            $this->topologyService->declareShiftClosedTopology($channel);

            $event = $this->buildEventPayload($shift);
            $message = new AMQPMessage(
                json_encode($event, JSON_THROW_ON_ERROR),
                [
                    'content_type' => 'application/json',
                    'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                    'message_id' => $event['event_id'],
                    'timestamp' => time(),
                    'type' => $event['event_type'],
                ]
            );

            $channel->basic_publish(
                $message,
                (string) config('rabbitmq.exchange', 'pos.events'),
                (string) config('rabbitmq.routing.shift_closed', 'shift.closed')
            );
        } catch (Throwable $exception) {
            Log::warning('ShiftClosed event publish failed.', [
                'error' => $exception->getMessage(),
                'shift_id' => (string) data_get($shift, 'id', ''),
            ]);

            if ((bool) config('rabbitmq.publish_fail_hard', false)) {
                throw $exception;
            }
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

    private function buildEventPayload(object $shift): array
    {
        return [
            'event_id' => (string) Str::uuid(),
            'event_type' => 'shift.closed.v1',
            'occurred_at' => now('UTC')->toIso8601String(),
            'tenant_id' => (string) data_get($shift, 'tenant_id', ''),
            'store_id' => (string) data_get($shift, 'store_id', ''),
            'user_id' => (string) data_get($shift, 'user_id', ''),
            'payload' => [
                'shift_id' => (string) data_get($shift, 'id', ''),
                'opening_balance' => (string) data_get($shift, 'opening_balance', '0.00'),
                'closing_balance' => (string) data_get($shift, 'closing_balance', '0.00'),
                'opened_at' => (string) data_get($shift, 'opened_at', ''),
                'closed_at' => (string) data_get($shift, 'closed_at', ''),
            ],
        ];
    }
}
