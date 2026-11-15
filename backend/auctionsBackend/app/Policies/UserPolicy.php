<?php

namespace App\Policies;

use App\Enums\UserStatus;
use App\Models\User;

class UserPolicy
{
    public function view(User $actor, User $target): bool
    {
        return $actor->hasAnyRole(['admin', 'super_admin']) || $actor->id === $target->id;
    }

    public function update(User $actor, User $target): bool
    {
        return $actor->id === $target->id && $target->status === UserStatus::Active;
    }

    public function suspend(User $actor, User $target): bool
    {
        return $actor->hasAnyRole(['admin', 'super_admin']) && !$target->hasRole('super_admin');
    }

    public function impersonate(User $actor, User $target): bool
    {
        return $actor->hasAnyRole(['admin', 'super_admin']) && $actor->id !== $target->id && !$target->hasRole('super_admin');
    }

    public function manageFeatureFlags(User $actor): bool
    {
        return $actor->hasAnyRole(['admin', 'super_admin']);
    }
}
