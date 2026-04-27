<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StaffUserController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/health', [AuthController::class, 'health']);

Route::post('/auth/bootstrap-admin', [AuthController::class, 'bootstrapPlatformAdmin']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/refresh', [AuthController::class, 'refresh']);

Route::middleware('auth.jwt')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    Route::middleware('role:platform_admin,tenant_admin')->group(function (): void {
        Route::get('/auth/staff', [StaffUserController::class, 'index']);
        Route::post('/auth/staff', [StaffUserController::class, 'store']);
    });
});
