<?php

use App\Http\Controllers\ShiftController;
use App\Http\Controllers\StaffUserController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [TenantController::class, 'health']);

Route::middleware(['auth.jwt', 'role:platform_admin'])->group(function (): void {
    Route::get('/tenants', [TenantController::class, 'index']);
    Route::post('/tenants', [TenantController::class, 'store']);
});

Route::middleware(['auth.jwt', 'role:platform_admin,tenant_admin,user'])->group(function (): void {
    Route::get('/stores', [StoreController::class, 'index']);
});

Route::middleware(['auth.jwt', 'role:platform_admin,tenant_admin'])->group(function (): void {
    Route::post('/stores', [StoreController::class, 'store']);
});

Route::middleware(['auth.jwt', 'role:tenant_admin,user'])->group(function (): void {
    Route::post('/shifts/open', [ShiftController::class, 'open']);
    Route::post('/shifts/close', [ShiftController::class, 'close']);
    Route::get('/shifts/current', [ShiftController::class, 'current']);
});

Route::middleware(['auth.jwt', 'role:platform_admin,tenant_admin'])->group(function (): void {
    Route::get('/users', [StaffUserController::class, 'index']);
    Route::post('/users', [StaffUserController::class, 'store']);
});
