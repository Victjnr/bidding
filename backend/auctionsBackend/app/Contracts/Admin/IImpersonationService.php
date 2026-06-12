<?php

namespace App\Contracts\Admin;

use App\Models\User;

interface IImpersonationService
{
    public function impersonate(User $admin, User $target): string;
    public function stopImpersonating(string $jti): void;
}
