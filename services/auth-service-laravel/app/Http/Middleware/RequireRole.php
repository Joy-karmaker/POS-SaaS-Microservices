<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $claims = $request->attributes->get('auth_claims');
        if (!is_array($claims)) {
            return $this->jsonError('Unauthorized.', 401);
        }

        if ($roles === []) {
            return $next($request);
        }

        $role = (string) ($claims['role'] ?? '');
        if (!in_array($role, $roles, true)) {
            return $this->jsonError('Forbidden.', 403);
        }

        return $next($request);
    }

    private function jsonError(string $message, int $status): JsonResponse
    {
        return response()->json([
            'error' => $message,
        ], $status);
    }
}
