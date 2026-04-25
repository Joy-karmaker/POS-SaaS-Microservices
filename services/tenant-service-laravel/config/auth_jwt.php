<?php

declare(strict_types=1);

return [
    'issuer' => env('AUTH_JWT_ISSUER', 'pos-auth'),
    'audience' => env('AUTH_JWT_AUDIENCE', 'pos-clients'),
    'access_ttl_seconds' => (int) env('AUTH_JWT_ACCESS_TTL', 3600),
    'refresh_ttl_seconds' => (int) env('AUTH_JWT_REFRESH_TTL', 1209600),
    'secret' => env('AUTH_JWT_SECRET', 'change-me-in-production'),
];
