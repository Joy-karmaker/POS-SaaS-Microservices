<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DuplicateUserEmailException;
use App\Exceptions\TenantNotFoundException;
use App\Repositories\TenantRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class StaffUserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly TenantRepository $tenantRepository
    ) {
    }

    public function list(int|string|null $tenantId = null): Collection
    {
        return $this->userRepository->allByTenant($tenantId);
    }

    public function create(int|string $tenantId, ?string $usernameInput, string $password, string $role): object
    {
        $tenant = $this->tenantRepository->findById($tenantId);
        
        if ($tenant === null) {
            throw new TenantNotFoundException('Tenant not found.');
        }

        // Rule: tenant users username should be shop name.role (or shop name.username)
        $cleanShopName = Str::slug($tenant->name, '');
        $suffix = $usernameInput ? Str::slug($usernameInput, '') : strtolower(trim($role));
        $username = sprintf('%s.%s', $cleanShopName, $suffix);

        if ($this->userRepository->findByUsername($username, $tenantId) !== null) {
            throw new DuplicateUserEmailException(sprintf(
                'User with username "%s" already exists for this tenant.',
                $username
            ));
        }

        return $this->userRepository->createTenantUser(
            $tenantId,
            $username,
            Hash::make($password ?? 'password123'),
            $role
        );
    }
}
