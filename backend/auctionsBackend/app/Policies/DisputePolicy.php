<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DisputePolicy
{
    /**
     * Only the buyer can open a dispute (typically), or both sides if it's mutual.
     * We'll enforce buyer-only for opening based on M4 rules.
     */
    public function open(User $user, Transaction $transaction): bool
    {
        return $user->id === $transaction->buyer_id;
    }

    /**
     * Only admins/moderators can resolve disputes
     */
    public function resolve(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }
}
