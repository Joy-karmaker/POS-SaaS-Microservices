<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StaffUserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [AuthController::class, 'health']);

Route::post('/bootstrap-admin', [AuthController::class, 'bootstrapPlatformAdmin']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);

Route::middleware('auth.jwt')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::middleware('role:platform_admin,tenant_admin')->group(function (): void {
        Route::get('/staff', [StaffUserController::class, 'index']);
        Route::post('/staff', [StaffUserController::class, 'store']);
    });
});
