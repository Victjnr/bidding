<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PaymentPolicy
{
    /**
     * Only the buyer on the transaction can capture it (i.e. provide payment details)
     */
    public function capture(User $user, Transaction $transaction): bool
    {
        return $user->id === $transaction->buyer_id;
    }
}
