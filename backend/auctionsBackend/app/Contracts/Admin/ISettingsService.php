<?php

namespace App\Contracts\Admin;

use App\Models\User;

interface ISettingsService
{
    public function get(string $key, mixed $default = null): mixed;
    public function set(string $key, mixed $value, User $actor): void;
}
