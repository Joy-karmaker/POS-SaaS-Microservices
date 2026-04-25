<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ActiveShiftExistsException;
use App\Exceptions\ActiveShiftNotFoundException;
use App\Exceptions\StoreNotFoundException;
use App\Http\Requests\Shift\CloseShiftRequest;
use App\Http\Requests\Shift\CurrentShiftRequest;
use App\Http\Requests\Shift\OpenShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ShiftController extends Controller
{
    public function open(OpenShiftRequest $request, ShiftService $shiftService): JsonResponse
    {
        $actor = $this->readActor($request);
        if ($actor === null) {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $shift = $shiftService->open(
                $actor['tenant_id'],
                $actor['user_id'],
                (string) $request->validated('store_id'),
                $request->validated('opening_balance')
            );

            return response()->json([
                'message' => 'Shift opened successfully.',
                'shift' => (new ShiftResource($shift))->resolve(),
            ], 201);
        } catch (StoreNotFoundException $exception) {
            return $this->jsonError($exception->getMessage(), 404);
        } catch (ActiveShiftExistsException $exception) {
            return $this->jsonError($exception->getMessage(), 409);
        } catch (Throwable $exception) {
            Log::error('Shift open failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Shift open failed.', 500);
        }
    }

    public function close(CloseShiftRequest $request, ShiftService $shiftService): JsonResponse
    {
        $actor = $this->readActor($request);
        if ($actor === null) {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $shift = $shiftService->close(
                $actor['tenant_id'],
                $actor['user_id'],
                (string) $request->validated('store_id'),
                $request->validated('closing_balance')
            );

            return response()->json([
                'message' => 'Shift closed successfully.',
                'shift' => (new ShiftResource($shift))->resolve(),
            ]);
        } catch (StoreNotFoundException|ActiveShiftNotFoundException $exception) {
            return $this->jsonError($exception->getMessage(), 404);
        } catch (Throwable $exception) {
            Log::error('Shift close failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Shift close failed.', 500);
        }
    }

    public function current(CurrentShiftRequest $request, ShiftService $shiftService): JsonResponse
    {
        $actor = $this->readActor($request);
        if ($actor === null) {
            return $this->jsonError('Forbidden.', 403);
        }

        try {
            $shift = $shiftService->current(
                $actor['tenant_id'],
                $actor['user_id'],
                (string) $request->validated('store_id')
            );
        } catch (StoreNotFoundException $exception) {
            return $this->jsonError($exception->getMessage(), 404);
        } catch (Throwable $exception) {
            Log::error('Shift current lookup failed.', [
                'exception' => $exception->getMessage(),
            ]);

            return $this->jsonError('Failed to load current shift.', 500);
        }

        if ($shift === null) {
            return $this->jsonError('No active shift found for this store.', 404);
        }

        return response()->json([
            'shift' => (new ShiftResource($shift))->resolve(),
        ]);
    }

    private function readActor(Request $request): ?array
    {
        $claims = $request->attributes->get('auth_claims');
        if (!is_array($claims)) {
            return null;
        }

        $userId = trim((string) ($claims['sub'] ?? ''));
        $tenantId = trim((string) ($claims['tenant_id'] ?? ''));

        if ($userId === '' || $tenantId === '') {
            return null;
        }

        return [
            'user_id' => $userId,
            'tenant_id' => $tenantId,
        ];
    }

    private function jsonError(string $message, int $status): JsonResponse
    {
        return response()->json([
            'error' => $message,
        ], $status);
    }
}
