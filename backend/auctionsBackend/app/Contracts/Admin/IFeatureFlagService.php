<?php

namespace App\Contracts\Admin;

use App\Models\User;

interface IFeatureFlagService
{
    public function isEnabled(string $flag, ?User $user = null): bool;
    public function toggle(string $flag, User $actor): void;
}
