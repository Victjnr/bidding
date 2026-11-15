<?php

namespace App\Policies;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\User;

class AuctionPolicy
{
    /**
     * Public for Active/Sold/Ended auctions; otherwise owner or admin.
     */
    public function view(?User $user, Auction $auction): bool
    {
        $publicStatuses = [
            AuctionStatus::Active,
            AuctionStatus::Extended,
            AuctionStatus::Closing,
            AuctionStatus::Ended,
            AuctionStatus::Sold,
            AuctionStatus::NoSale,
        ];

        if (in_array($auction->status, $publicStatuses)) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        return $user->id === $auction->seller_id || $user->hasAnyRole(['admin', 'super_admin', 'moderator']);
    }

    /**
     * Any authenticated non-banned user can create an auction (seller role is auto-assigned).
     */
    public function create(User $user): bool
    {
        return !$user->is_banned;
    }

    /**
     * auth + is seller owner + status.isEditable()
     */
    public function update(User $user, Auction $auction): bool
    {
        return ($user->id === $auction->seller_id && $auction->status->isEditable()) || $user->hasAnyRole(['admin', 'super_admin']);
    }

    /**
     * auth + is seller owner + status === Draft
     */
    public function delete(User $user, Auction $auction): bool
    {
        return ($user->id === $auction->seller_id && $auction->status === AuctionStatus::Draft) || $user->hasAnyRole(['admin', 'super_admin']);
    }

    /**
     * auth + hasAnyRole([admin, super_admin, moderator])
     */
    public function approve(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin', 'moderator']);
    }

    /**
     * auth + hasAnyRole([admin, super_admin])
     */
    public function forceClose(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
