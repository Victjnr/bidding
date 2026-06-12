<?php

namespace App\Contracts\Auth;

use App\Models\User;

interface IUserRepository
{
    public function findByEmail(string $email): ?User;
    public function findById(int $id): ?User;
    public function findByUuid(string $uuid): ?User;
    public function create(array $data): User;
    public function update(User $user, array $data): bool;
}
