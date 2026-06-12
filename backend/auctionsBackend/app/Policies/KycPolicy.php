<?php

namespace App\Policies;

use App\Models\KycDocument;
use App\Models\User;

class KycPolicy
{
    public function review(User $actor, KycDocument $document): bool
    {
        return $actor->hasRole('admin') || $actor->hasRole('moderator');
    }
}
