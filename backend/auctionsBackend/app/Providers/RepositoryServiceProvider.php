<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // ── M1: Auth / KYC ──
        $this->app->bind(\App\Contracts\Auth\IUserRepository::class, \App\Repositories\Auth\UserRepository::class);
        $this->app->bind(\App\Contracts\Auth\IKycRepository::class, \App\Repositories\Auth\KycRepository::class);
        $this->app->bind(\App\Contracts\Auth\IAuthService::class, \App\Services\Auth\AuthService::class);
        $this->app->bind(\App\Contracts\Auth\IKycService::class, \App\Services\Auth\KycService::class);

        // ── M2: Auction ──
        $this->app->bind(\App\Contracts\Auction\IAuctionRepository::class, \App\Repositories\Auction\AuctionRepository::class);
        $this->app->bind(\App\Contracts\Auction\IAuctionMediaRepository::class, \App\Repositories\Auction\AuctionMediaRepository::class);
        $this->app->bind(\App\Contracts\Auction\IAuctionService::class, \App\Services\Auction\AuctionService::class);

        // ── M3: Bid ──
        $this->app->bind(\App\Contracts\Bid\IBidRepository::class, \App\Repositories\Bid\BidRepository::class);
        $this->app->bind(\App\Contracts\Bid\IBidService::class, \App\Services\Bid\BidService::class);
        // ── M4: Payments, Wallet & Disputes ──
        $this->app->bind(\App\Contracts\Payment\ITransactionRepository::class, \App\Repositories\Payment\TransactionRepository::class);
        $this->app->bind(\App\Contracts\Payment\IWalletLedgerRepository::class, \App\Repositories\Payment\WalletLedgerRepository::class);
        $this->app->bind(\App\Contracts\Payment\ICommissionTierRepository::class, \App\Repositories\Payment\CommissionTierRepository::class);
        $this->app->bind(\App\Contracts\Payment\IDisputeRepository::class, \App\Repositories\Payment\DisputeRepository::class);
        $this->app->bind(\App\Contracts\Payment\IDisputeEvidenceRepository::class, \App\Repositories\Payment\DisputeEvidenceRepository::class);

        $this->app->bind(\App\Contracts\Payment\ICommissionService::class, \App\Services\Payment\CommissionService::class);
        $this->app->bind(\App\Contracts\Payment\IWalletService::class, \App\Services\Payment\WalletService::class);
        $this->app->bind(\App\Contracts\Payment\IPaymentService::class, \App\Services\Payment\PaymentService::class);
        $this->app->bind(\App\Contracts\Payment\IDisputeService::class, \App\Services\Payment\DisputeService::class);

        // ── M5: Notifications & Messaging ──
        $this->app->bind(\App\Contracts\Messaging\IConversationRepository::class, \App\Repositories\Messaging\ConversationRepository::class);
        $this->app->bind(\App\Contracts\Messaging\IMessageRepository::class, \App\Repositories\Messaging\MessageRepository::class);
        
        $this->app->bind(\App\Contracts\Notification\INotificationService::class, \App\Services\Notification\NotificationService::class);
        $this->app->bind(\App\Contracts\Messaging\IMessageService::class, \App\Services\Messaging\MessageService::class);

        // ── M6: Search & Discovery ──
        $this->app->bind(\App\Contracts\Search\ISearchService::class, \App\Services\Search\SearchService::class);

        // ── M7: Seller Analytics ──
        $this->app->bind(\App\Contracts\Analytics\ISellerAnalyticsService::class, \App\Services\Analytics\SellerAnalyticsService::class);

        // ── M8: Admin Panel ──
        $this->app->bind(\App\Contracts\Admin\IAuditService::class, \App\Services\Admin\AuditService::class);
        $this->app->bind(\App\Contracts\Admin\IFeatureFlagService::class, \App\Services\Admin\FeatureFlagService::class);
        $this->app->bind(\App\Contracts\Admin\ISettingsService::class, \App\Services\Admin\SettingsService::class);
        $this->app->bind(\App\Contracts\Admin\IImpersonationService::class, \App\Services\Admin\ImpersonationService::class);

        // ── M9: User Account ──
        $this->app->bind(\App\Contracts\Account\IAccountService::class, \App\Services\Account\AccountService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
