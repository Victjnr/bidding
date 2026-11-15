<?php

use App\Http\Controllers\Api\V1\Admin\AdminAuctionController;
use App\Http\Controllers\Api\V1\Auction\AuctionController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\User\KycController;
use App\Http\Controllers\Api\V1\Bid\BidController;
use App\Http\Controllers\Api\V1\Payment\PaymentController;
use App\Http\Controllers\Api\V1\Payment\DisputeController;
use App\Http\Controllers\Api\V1\Webhook\StripeWebhookController;
use App\Http\Controllers\Api\V1\Notification\NotificationController;
use App\Http\Controllers\Api\V1\Messaging\ConversationController;
use App\Http\Controllers\Api\V1\Search\SearchController;
use App\Http\Controllers\Api\V1\Search\SavedSearchController;
use App\Http\Controllers\Api\V1\Home\HomeController;
use App\Http\Controllers\Api\V1\Home\RecommendationController;
use App\Http\Controllers\Api\V1\Seller\SellerController;
use App\Http\Controllers\Api\V1\Seller\SellerProfileController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\AdminKycController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminSettingsController;
use App\Http\Controllers\Api\V1\Admin\AdminAuditController;
use App\Http\Controllers\Api\V1\Account\AccountController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Enterprise V1 API Group
Route::prefix('v1')->middleware(['api', 'security.headers', 'force.https', 'security.log'])->group(function () {

    // ══════════════════════════════════════════════════════════════
    // M1 — Auth Routes
    // ══════════════════════════════════════════════════════════════
    Route::prefix('auth')->name('api.v1.auth.')->middleware('throttle:auth')->group(function () {
        Route::post('register', [AuthController::class, 'store'])->name('register');
        Route::post('login', [AuthController::class, 'login'])->name('login');
        Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
        Route::post('2fa/verify', [AuthController::class, 'verifyTwoFactor'])->name('2fa.verify');
        Route::post('email/verify', [AuthController::class, 'verifyEmail'])->name('email.verify');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me'])->name('me');
            Route::post('logout', [AuthController::class, 'destroy'])->name('logout');
            Route::post('2fa/enable', [AuthController::class, 'enableTwoFactor'])->name('2fa.enable');
            Route::post('2fa/confirm', [AuthController::class, 'confirmTwoFactor'])->name('2fa.confirm');
            Route::post('2fa/disable', [AuthController::class, 'disableTwoFactor'])->name('2fa.disable');
            Route::post('email/resend', [AuthController::class, 'resendVerificationEmail'])->name('email.resend');
            Route::post('phone/send-otp', [AuthController::class, 'sendPhoneOtp'])->name('phone.send-otp');
            Route::post('phone/verify', [AuthController::class, 'verifyPhoneOtp'])->name('phone.verify');
        });
    });

    // ══════════════════════════════════════════════════════════════
    // M2 — Public Auction Routes
    // ══════════════════════════════════════════════════════════════
    Route::get('/categories', [\App\Http\Controllers\Api\V1\CategoryController::class, 'index'])->name('api.v1.categories.index');
    Route::get('/settings/dropdown-options', [\App\Http\Controllers\Api\V1\DropdownOptionsController::class, 'index'])->name('api.v1.settings.dropdown-options');

    // Stats
    Route::get('/stats/landing', [\App\Http\Controllers\Api\V1\Public\StatsController::class, 'landing']);

    Route::prefix('auctions')->name('api.v1.auctions.')->group(function () {
        Route::get('/', [AuctionController::class, 'index'])->name('index');
        Route::get('/{auction}', [AuctionController::class, 'show'])->name('show');

        // ── M3: Public Bid Listing ──
        Route::get('/{auction}/bids', [BidController::class, 'index'])->name('bids.index');
    });

    // ── M6: Public Search & Home ──
    Route::get('/search', [SearchController::class, 'index'])->name('api.v1.search.index');
    Route::get('/search/autocomplete', [SearchController::class, 'autocomplete'])->name('api.v1.search.autocomplete');
    Route::get('/search/suggestions', [SearchController::class, 'autocomplete'])->name('api.v1.search.suggestions');
    Route::get('/search/facets', [SearchController::class, 'facets'])->name('api.v1.search.facets');
    Route::get('/home/featured', [HomeController::class, 'featured'])->name('api.v1.home.featured');

    // ── M7: Public Seller Profiles ──
    Route::prefix('sellers')->name('api.v1.sellers.')->group(function () {
        Route::get('/{uuid}', [SellerProfileController::class, 'show'])->name('show');
        Route::get('/{uuid}/listings', [SellerProfileController::class, 'listings'])->name('listings');
        Route::get('/{uuid}/auctions', [SellerProfileController::class, 'listings'])->name('auctions');
    });

    // ══════════════════════════════════════════════════════════════
    // M4 — Webhooks
    // ══════════════════════════════════════════════════════════════
    Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle'])
        ->middleware(\App\Http\Middleware\VerifyStripeWebhookSignature::class)
        ->name('api.v1.webhooks.stripe');

    // Health Check
    Route::get('/health', [\App\Http\Controllers\Api\V1\HealthController::class, 'check'])->name('api.v1.health');

    // ══════════════════════════════════════════════════════════════
    // Authenticated Routes
    // ══════════════════════════════════════════════════════════════
    Route::middleware('auth:sanctum')->group(function () {

        // ── M1: KYC ──
        Route::prefix('kyc')->name('api.v1.kyc.')->group(function () {
            Route::post('upload', [KycController::class, 'upload'])->name('upload');
            Route::get('status', [KycController::class, 'status'])->name('status');
        });

        // Frontend auth/kyc aliases (authApi.ts uses /auth/kyc/...)
        Route::get('/auth/kyc/status', [KycController::class, 'status'])->name('auth.kyc.status');
        Route::post('/auth/kyc/upload', [KycController::class, 'upload'])->name('auth.kyc.upload');

        // ── M2: Auction CRUD (seller) ──
        Route::prefix('auctions')->name('api.v1.auctions.')->group(function () {
            Route::post('/', [AuctionController::class, 'store'])->name('store');
            Route::match(['put', 'patch'], '/{auction}', [AuctionController::class, 'update'])->name('update');
            Route::delete('/{auction}', [AuctionController::class, 'destroy'])->name('destroy');
            Route::post('/{auction}/media', [AuctionController::class, 'uploadMedia'])
                ->middleware('throttle:uploads')->name('media.store');
            Route::delete('/{auction}/media/{media}', [AuctionController::class, 'destroyMedia'])->name('media.destroy');
            Route::post('/{auction}/submit', [AuctionController::class, 'submitForReview'])->name('submit');
            Route::post('/{auction}/watch', [AuctionController::class, 'toggleWatch'])->name('watch');
        });

        // ── M2: Admin Auction Routes ──
        Route::prefix('admin/auctions')->name('api.v1.admin.auctions.')->group(function () {
            Route::get('/', [AdminAuctionController::class, 'pendingQueue'])->name('index');
            Route::post('/{auction}/approve', [AdminAuctionController::class, 'approve'])->name('approve');
            Route::post('/{auction}/reject', [AdminAuctionController::class, 'reject'])->name('reject');
            Route::post('/{auction}/request-changes', [AdminAuctionController::class, 'requestChanges'])->name('request-changes');
            Route::post('/{auction}/close', [AdminAuctionController::class, 'forceClose'])->name('close');
            Route::post('/{auction}/force-close', [AdminAuctionController::class, 'forceClose'])->name('force-close');
        });

        // ── M3: Bidding Engine ──
        Route::prefix('auctions/{auction}')->name('api.v1.bids.')->group(function () {
            Route::post('/bids', [BidController::class, 'store'])
                ->middleware('throttle:bids')->name('store');
            Route::get('/proxy-bids/current', [BidController::class, 'currentProxy'])->name('proxy.current');
            Route::post('/proxy-bids', [BidController::class, 'storeProxy'])->name('proxy.store');
            Route::delete('/proxy-bids', [BidController::class, 'destroyProxy'])->name('proxy.destroy');
        });

        // ── M4: Payments, Wallet & Disputes ──
        Route::post('/auctions/{auction}/payment/capture', [PaymentController::class, 'capture'])->name('api.v1.payment.capture');
        Route::post('/transactions/{transaction}/disputes', [DisputeController::class, 'store'])->name('api.v1.disputes.store');
        Route::get('/disputes', [DisputeController::class, 'index'])->name('api.v1.disputes.index');
        Route::get('/disputes/{dispute}', [DisputeController::class, 'show'])->name('api.v1.disputes.show');
        Route::post('/disputes', [DisputeController::class, 'createFromAuction'])->name('api.v1.disputes.create');
        Route::post('/disputes/{dispute}/evidence', [DisputeController::class, 'uploadEvidence'])->name('api.v1.disputes.evidence.store');

        // Admin resolving dispute
        Route::post('/admin/disputes/{dispute}/resolve', [DisputeController::class, 'resolve'])->name('api.v1.admin.disputes.resolve');

        // ── M5: Notifications & Messaging ──
        Route::prefix('notifications')->name('api.v1.notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('/mark-read', [NotificationController::class, 'markRead'])->name('mark-read');
            Route::match(['post', 'patch'], '/{id}/read', [NotificationController::class, 'markRead'])->name('read-single');
            Route::post('/mark-all-read', [NotificationController::class, 'markAllRead'])->name('mark-all-read');
            Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('read-all');
            Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
            Route::get('/preferences', [NotificationController::class, 'getPreferences'])->name('preferences.get');
            Route::match(['put', 'patch'], '/preferences', [NotificationController::class, 'updatePreferences'])->name('preferences.update');
        });

        Route::prefix('conversations')->name('api.v1.conversations.')->group(function () {
            Route::get('/', [ConversationController::class, 'index'])->name('index');
            Route::post('/', [ConversationController::class, 'create'])->name('create');
            Route::get('/{id}/messages', [ConversationController::class, 'messages'])->name('messages');
            Route::post('/{id}/messages', [ConversationController::class, 'store'])
                ->middleware('throttle:30,1')->name('messages.store');
            Route::match(['post', 'patch'], '/{id}/read', [ConversationController::class, 'markRead'])->name('read');
            Route::post('/auctions/{uuid}/message-seller', [ConversationController::class, 'initiate'])->name('initiate');
        });

        // ── M6: Recommendations & Saved Searches ──
        Route::get('/recommendations', [RecommendationController::class, 'index'])->name('api.v1.recommendations.index');
        Route::get('/search/recommendations', [RecommendationController::class, 'index'])->name('api.v1.search.recommendations');
        Route::prefix('saved-searches')->name('api.v1.saved-searches.')->group(function () {
            Route::get('/', [SavedSearchController::class, 'index'])->name('index');
            Route::post('/', [SavedSearchController::class, 'store'])->name('store');
            Route::delete('/{uuid}', [SavedSearchController::class, 'destroy'])->name('destroy');
        });
        Route::prefix('search/saved')->name('api.v1.search.saved.')->group(function () {
            Route::get('/', [SavedSearchController::class, 'index'])->name('index');
            Route::post('/', [SavedSearchController::class, 'store'])->name('store');
            Route::delete('/{uuid}', [SavedSearchController::class, 'destroy'])->name('destroy');
        });

        // ── M7: Seller Dashboard & Analytics ──
        Route::prefix('seller')->name('api.v1.seller.')->group(function () {
            Route::get('/dashboard', [SellerController::class, 'dashboardStats'])->name('dashboard');
            Route::get('/stats', [SellerController::class, 'dashboardStats'])->name('stats');
            Route::get('/revenue', [SellerController::class, 'revenueChart'])->name('revenue');
            Route::get('/revenue-chart', [SellerController::class, 'revenueChart'])->name('revenue-chart');
            Route::get('/analytics', [SellerController::class, 'listingPerformance'])->name('analytics');
            Route::get('/listings', [SellerController::class, 'myListings'])->name('listings');
            Route::get('/auctions', [SellerController::class, 'myListings'])->name('auctions');
            Route::post('/auctions/bulk', [SellerController::class, 'bulkAction'])->name('auctions.bulk');
            Route::get('/payouts', [SellerController::class, 'payoutHistory'])->name('payouts');
        });

        // ── M8: Admin Panel ──
        Route::prefix('admin')->name('api.v1.admin.')->group(function () {

            // Dashboard
            Route::get('/stats', [AdminDashboardController::class, 'stats'])->name('dashboard.stats');
            Route::get('/revenue-chart', [AdminDashboardController::class, 'revenueChart'])->name('dashboard.revenue');
            Route::get('/registrations-chart', [AdminDashboardController::class, 'userGrowth'])->name('dashboard.user-growth');
            Route::get('/bid-velocity', [\App\Http\Controllers\Api\V1\Admin\BidVelocityController::class, 'index'])->name('bid-velocity');

            // KYC Management
            Route::prefix('kyc')->name('kyc.')->group(function () {
                Route::get('/', [AdminKycController::class, 'pendingQueue'])->name('pending');
                Route::post('/{uuid}/approve', [AdminKycController::class, 'approve'])->name('approve');
                Route::post('/{uuid}/reject', [AdminKycController::class, 'reject'])->name('reject');
            });

            // Users & Impersonation
            Route::prefix('users')->name('users.')->group(function () {
                Route::get('/', [AdminUserController::class, 'index'])->name('index');
                Route::get('/{uuid}', [AdminUserController::class, 'show'])->name('show');
                Route::match(['post', 'patch'], '/{uuid}/suspend', [AdminUserController::class, 'suspend'])->name('suspend');
                Route::match(['post', 'patch'], '/{uuid}/ban', [AdminUserController::class, 'ban'])->name('ban');
                Route::post('/{uuid}/impersonate', [AdminUserController::class, 'impersonate'])->name('impersonate');
                Route::post('/stop-impersonating', [AdminUserController::class, 'stopImpersonating'])->name('stop-impersonating');
            });
            Route::post('/impersonate/end', [AdminUserController::class, 'stopImpersonating'])->name('impersonate.end');

            // Settings & Feature Flags
            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('/', [AdminSettingsController::class, 'index'])->name('index');
                Route::match(['put', 'patch'], '/', [AdminSettingsController::class, 'update'])->name('update');
            });
            Route::get('/feature-flags', [AdminSettingsController::class, 'flagIndex'])->name('feature-flags.index');
            Route::match(['put', 'patch'], '/feature-flags/{name}', [AdminSettingsController::class, 'toggleFlag'])->name('feature-flags.toggle');

            // Categories
            Route::prefix('categories')->name('categories.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Api\V1\Admin\AdminCategoryController::class, 'index'])->name('index');
                Route::post('/', [\App\Http\Controllers\Api\V1\Admin\AdminCategoryController::class, 'store'])->name('store');
                Route::match(['put', 'patch'], '/{id}', [\App\Http\Controllers\Api\V1\Admin\AdminCategoryController::class, 'update'])->name('update');
                Route::delete('/{id}', [\App\Http\Controllers\Api\V1\Admin\AdminCategoryController::class, 'destroy'])->name('destroy');
                Route::post('/{id}/restore', [\App\Http\Controllers\Api\V1\Admin\AdminCategoryController::class, 'restore'])->name('restore');
            });

            // Audit Logs
            Route::get('/audit-logs', [AdminAuditController::class, 'index'])->name('audit-logs.index');
        });

        // ── M9: User Account & Settings ──
        Route::prefix('account')->name('api.v1.account.')->group(function () {
            Route::get('/profile', [AccountController::class, 'show'])->name('profile.show');
            Route::match(['put', 'patch'], '/profile', [AccountController::class, 'update'])->name('profile.update');
            Route::post('/avatar', [AccountController::class, 'uploadAvatar'])->name('avatar.upload');
            Route::post('/security/password', [AccountController::class, 'changePassword'])->name('password.change');
            Route::get('/security/sessions', [AccountController::class, 'activeSessions'])->name('sessions.index');
            Route::delete('/security/sessions/{id}', [AccountController::class, 'revokeSession'])->name('sessions.revoke');
            Route::get('/security/login-history', [AccountController::class, 'loginHistory'])->name('login-history');
            Route::get('/bids', [AccountController::class, 'myBids'])->name('bids.index');
            Route::get('/watchlist', [AccountController::class, 'watchlist'])->name('watchlist.index');
            Route::match(['put', 'patch'], '/watchlist/{auctionUuid}/preferences', [AccountController::class, 'updateWatchlistPreferences'])->name('watchlist.preferences');
            Route::get('/addresses', [AccountController::class, 'addresses'])->name('addresses.index');
            Route::post('/addresses', [AccountController::class, 'storeAddress'])->name('addresses.store');
            Route::match(['put', 'patch'], '/addresses/{uuid}', [AccountController::class, 'updateAddress'])->name('addresses.update');
            Route::match(['post', 'patch'], '/addresses/{uuid}/default', [AccountController::class, 'setDefaultAddress'])->name('addresses.default');
            Route::delete('/addresses/{uuid}', [AccountController::class, 'destroyAddress'])->name('addresses.destroy');
            Route::post('/export-data', [AccountController::class, 'requestDataExport'])->name('export-data');
            Route::post('/close', [AccountController::class, 'closeAccount'])->name('account.close');
        });

        // ── M10: Payments & Wallet ──
        Route::prefix('payments')->name('api.v1.payments.')->group(function () {
            Route::get('/methods', [PaymentController::class, 'methods'])->name('methods.index');
            Route::post('/methods', [PaymentController::class, 'addMethod'])->name('methods.store');
            Route::delete('/methods/{id}', [PaymentController::class, 'removeMethod'])->name('methods.destroy');
            Route::post('/initiate', [PaymentController::class, 'initiate'])->name('initiate');
            Route::get('/status', [PaymentController::class, 'status'])->name('status');
        });

        Route::prefix('wallet')->name('api.v1.wallet.')->group(function () {
            Route::get('/balance', [PaymentController::class, 'walletBalance'])->name('balance');
            Route::get('/ledger', [PaymentController::class, 'walletLedger'])->name('ledger');
            Route::get('/payouts', [PaymentController::class, 'payouts'])->name('payouts');
            Route::post('/payouts/request', [PaymentController::class, 'requestPayout'])->name('payouts.request');
        });
    });

});

