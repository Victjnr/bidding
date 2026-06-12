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
        ];

        if (in_array($auction->status, $publicStatuses)) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        return $user->id === $auction->seller_id || $user->hasAnyRole(['admin', 'moderator']);
    }

    /**
     * auth + hasRole(seller) + kyc_tier >= 1
     */
    public function create(User $user): bool
    {
        return $user->hasRole('seller') && ($user->kyc_tier ?? 0) >= 1;
    }

    /**
     * auth + is seller owner + status.isEditable()
     */
    public function update(User $user, Auction $auction): bool
    {
        return $user->id === $auction->seller_id && $auction->status->isEditable();
    }

    /**
     * auth + is seller owner + status === Draft
     */
    public function delete(User $user, Auction $auction): bool
    {
        return $user->id === $auction->seller_id && $auction->status === AuctionStatus::Draft;
    }

    /**
     * auth + hasAnyRole([admin, moderator])
     */
    public function approve(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    /**
     * auth + hasRole(admin)
     */
    public function forceClose(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
