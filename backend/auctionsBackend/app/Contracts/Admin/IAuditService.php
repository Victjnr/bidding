<?php

namespace App\Contracts\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

interface IAuditService
{
    public function log(string $action, ?Model $subject, array $changes, ?User $actor = null): void;
}
