<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Auth\JwtService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class AuthenticateJwt
{
    public function __construct(
        private readonly JwtService $jwtService
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('pos_access_token');

        if (empty($token)) {
            $authorization = (string) $request->header('Authorization', '');
            if (str_starts_with($authorization, 'Bearer ')) {
                $token = trim(substr($authorization, 7));
            }
        }

        if (empty($token)) {
            return $this->unauthorized('Missing bearer token or cookie.');
        }

        try {
            $claims = $this->jwtService->decodeAndValidate($token);
        } catch (Throwable $exception) {
            return $this->unauthorized('Invalid or expired token.');
        }

        $request->attributes->set('auth_claims', $claims);

        return $next($request);
    }

    private function unauthorized(string $message): JsonResponse
    {
        return response()->json([
            'error' => $message,
        ], 401);
    }
}
