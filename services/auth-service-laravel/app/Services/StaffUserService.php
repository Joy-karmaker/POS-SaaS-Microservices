<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DuplicateUserEmailException;
use App\Exceptions\TenantNotFoundException;
use App\Repositories\TenantRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;

final class StaffUserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly TenantRepository $tenantRepository
    ) {
    }

    public function list(?string $tenantId = null): Collection
    {
        return $this->userRepository->allByTenant($tenantId);
    }

    public function create(string $tenantId, string $email, string $password, string $role): object
    {
        $normalizedTenantId = trim($tenantId);
        if ($normalizedTenantId === '' || !$this->tenantRepository->existsById($normalizedTenantId)) {
            throw new TenantNotFoundException('Tenant not found.');
        }

        $normalizedEmail = trim($email);
        if ($this->userRepository->findByEmail($normalizedEmail) !== null) {
            throw new DuplicateUserEmailException(sprintf(
                'User with email "%s" already exists.',
                strtolower($normalizedEmail)
            ));
        }

        return $this->userRepository->createTenantUser(
            $normalizedTenantId,
            $normalizedEmail,
            Hash::make($password),
            $role
        );
    }
}
