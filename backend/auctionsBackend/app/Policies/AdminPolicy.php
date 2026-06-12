<?php

namespace App\Policies;

use App\Models\User;

class AdminPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function impersonate(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function manageFeatureFlags(User $user): bool
    {
        return $user->hasRole('super_admin');
    }
}
