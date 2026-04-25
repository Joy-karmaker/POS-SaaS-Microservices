<?php

declare(strict_types=1);

namespace App\Services\Messaging;

use PhpAmqpLib\Channel\AMQPChannel;
use PhpAmqpLib\Wire\AMQPTable;

final class RabbitMqTopologyService
{
    public function declareShiftClosedTopology(AMQPChannel $channel): void
    {
        $exchange = (string) config('rabbitmq.exchange', 'pos.events');
        $exchangeType = (string) config('rabbitmq.exchange_type', 'topic');
        $dlx = (string) config('rabbitmq.dlx', 'pos.events.dlx');
        $queue = (string) config('rabbitmq.queues.shift_closed_audit', 'audit.shift.closed');
        $dlq = (string) config('rabbitmq.queues.shift_closed_dlq', 'audit.shift.closed.dlq');
        $routing = (string) config('rabbitmq.routing.shift_closed', 'shift.closed');
        $dlqRouting = (string) config('rabbitmq.routing.shift_closed_dlq', 'shift.closed.dlq');

        $channel->exchange_declare($exchange, $exchangeType, false, true, false);
        $channel->exchange_declare($dlx, 'direct', false, true, false);

        $channel->queue_declare(
            $queue,
            false,
            true,
            false,
            false,
            false,
            new AMQPTable([
                'x-dead-letter-exchange' => $dlx,
                'x-dead-letter-routing-key' => $dlqRouting,
            ])
        );

        $channel->queue_bind($queue, $exchange, $routing);

        $channel->queue_declare($dlq, false, true, false, false);
        $channel->queue_bind($dlq, $dlx, $dlqRouting);
    }
}
