<?php

declare(strict_types=1);

namespace App\Services\Messaging;

use PhpAmqpLib\Connection\AMQPStreamConnection;

final class RabbitMqConnectionFactory
{
    public function make(): AMQPStreamConnection
    {
        $this->defineSocketErrnoFallbacks();

        return new AMQPStreamConnection(
            (string) config('rabbitmq.host', '127.0.0.1'),
            (int) config('rabbitmq.port', 5672),
            (string) config('rabbitmq.user', 'guest'),
            (string) config('rabbitmq.password', 'guest'),
            (string) config('rabbitmq.vhost', '/'),
            false,
            'AMQPLAIN',
            null,
            'en_US',
            (float) config('rabbitmq.connection_timeout', 3.0),
            (float) config('rabbitmq.read_write_timeout', 60.0),
            null,
            (bool) config('rabbitmq.keepalive', true),
            (int) config('rabbitmq.heartbeat', 30)
        );
    }

    private function defineSocketErrnoFallbacks(): void
    {
        if (!defined('SOCKET_EAGAIN')) {
            define('SOCKET_EAGAIN', 11);
        }

        if (!defined('SOCKET_EWOULDBLOCK')) {
            define('SOCKET_EWOULDBLOCK', 11);
        }

        if (!defined('SOCKET_EINTR')) {
            define('SOCKET_EINTR', 4);
        }
    }
}
