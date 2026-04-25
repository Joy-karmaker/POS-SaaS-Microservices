<?php

declare(strict_types=1);

return [
    'host' => env('RABBITMQ_HOST', '127.0.0.1'),
    'port' => (int) env('RABBITMQ_PORT', 5672),
    'user' => env('RABBITMQ_USER', 'guest'),
    'password' => env('RABBITMQ_PASSWORD', 'guest'),
    'vhost' => env('RABBITMQ_VHOST', '/'),
    'connection_timeout' => (float) env('RABBITMQ_CONNECTION_TIMEOUT', 3.0),
    'read_write_timeout' => (float) env('RABBITMQ_READ_WRITE_TIMEOUT', 60.0),
    'heartbeat' => (int) env('RABBITMQ_HEARTBEAT', 30),
    'keepalive' => filter_var(env('RABBITMQ_KEEPALIVE', false), FILTER_VALIDATE_BOOL),

    'exchange' => env('RABBITMQ_EXCHANGE', 'pos.events'),
    'exchange_type' => env('RABBITMQ_EXCHANGE_TYPE', 'topic'),
    'dlx' => env('RABBITMQ_DLX', 'pos.events.dlx'),

    'routing' => [
        'shift_closed' => env('RABBITMQ_ROUTING_SHIFT_CLOSED', 'shift.closed'),
        'shift_closed_dlq' => env('RABBITMQ_ROUTING_SHIFT_CLOSED_DLQ', 'shift.closed.dlq'),
    ],

    'queues' => [
        'shift_closed_audit' => env('RABBITMQ_QUEUE_SHIFT_CLOSED_AUDIT', 'audit.shift.closed'),
        'shift_closed_dlq' => env('RABBITMQ_QUEUE_SHIFT_CLOSED_DLQ', 'audit.shift.closed.dlq'),
    ],

    'publish_fail_hard' => filter_var(
        env('RABBITMQ_PUBLISH_FAIL_HARD', false),
        FILTER_VALIDATE_BOOL
    ),
];
