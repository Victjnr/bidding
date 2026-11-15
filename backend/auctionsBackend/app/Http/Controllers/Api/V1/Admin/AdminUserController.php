<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Admin\IImpersonationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BanRequest;
use App\Http\Requests\Admin\SuspendRequest;
use App\Http\Requests\Admin\UserFilterRequest;
use App\Models\Auction;
use App\Models\AuditLog;
use App\Models\Bid;
use App\Models\Dispute;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(
        protected readonly IImpersonationService $impersonationService
    ) {}

    public function index(UserFilterRequest $request): JsonResponse
    {
        $query = User::query()->with('roles');

        if ($request->filled('role')) {
            $role = $request->input('role');
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $kycFilter = $request->input('kycTier') ?? $request->input('kyc_tier');
        if (!empty($kycFilter)) {
            $tierVariants = match (strtolower((string) $kycFilter)) {
                'enhanced', 'tier_3', '3' => ['enhanced', 'tier_3', '3', 3],
                'verified', 'tier_2', '2' => ['verified', 'tier_2', '2', 2],
                'basic', 'tier_1', '1' => ['basic', 'tier_1', '1', 1],
                default => ['none', 'tier_0', '0', 0, ''],
            };
            $query->whereIn('kyc_tier', $tierVariants);
        }

        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'like', "%{$searchTerm}%")
                  ->orWhere('last_name', 'like', "%{$searchTerm}%")
                  ->orWhere('display_name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $users = $query->latest()->paginate($perPage);

        $formatted = collect($users->items())->map(fn (User $u) => $this->formatAdminUser($u))->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        );
    }

    public function show(string $uuid): JsonResponse
    {
        $user = $this->findUser($uuid);
        $base = $this->formatAdminUser($user);

        $txSpent = (float) Transaction::where('buyer_id', $user->id)->sum('gross_amount');
        if ($txSpent <= 0) {
            $txSpent = (float) Auction::where('winner_id', $user->id)
                ->whereIn('status', ['sold', 'ended'])
                ->sum('current_price');
        }

        $txEarned = (float) Transaction::where('seller_id', $user->id)->sum('seller_payout');
        if ($txEarned <= 0) {
            $txEarned = (float) Auction::where('seller_id', $user->id)
                ->whereIn('status', ['sold', 'ended'])
                ->sum('current_price');
        }

        $disputeCount = Dispute::where('opened_by', $user->id)
            ->orWhereHas('transaction', fn ($q) => $q->where('buyer_id', $user->id)->orWhere('seller_id', $user->id))
            ->count();

        $loginHistory = $user->tokens()->latest()->take(10)->get()->map(fn ($token) => [
            'id' => (int) $token->id,
            'ip' => request()->ip() ?? '127.0.0.1',
            'device' => $token->name ?: 'Web Browser Session',
            'time' => ($token->last_used_at ?? $token->created_at ?? now())->toIso8601String(),
            'success' => true,
        ])->values()->all();

        $activeBids = Bid::where('bidder_id', $user->id)
            ->with('auction')
            ->latest()
            ->take(10)
            ->get()
            ->map(function (Bid $bid) {
                $auction = $bid->auction;
                $isWinning = $auction && (
                    ((int) $auction->winning_bid_id > 0 && (int) $auction->winning_bid_id === (int) $bid->id)
                    || ((int) $auction->winner_id === (int) $bid->bidder_id && (float) $bid->amount >= (float) $auction->current_price)
                );
                return [
                    'auctionUuid' => $auction?->uuid ?? (string) $bid->auction_id,
                    'auctionTitle' => $auction?->title ?? 'Auction #' . $bid->auction_id,
                    'amount' => (float) $bid->amount,
                    'isWinning' => (bool) $isWinning,
                ];
            })->values()->all();

        $listings = Auction::where('seller_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Auction $a) => [
                'uuid' => $a->uuid,
                'title' => $a->title,
                'currentPrice' => (float) ($a->current_price ?? $a->start_price ?? 0),
                'totalBids' => (int) $a->total_bids,
                'status' => $a->status instanceof \BackedEnum ? $a->status->value : (string) $a->status,
                'createdAt' => $a->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ])->values()->all();

        return ApiResponse::success(array_merge($base, [
            'phone' => $user->phone,
            'loginHistory' => $loginHistory,
            'activeBids' => $activeBids,
            'listings' => $listings,
            'transactionSummary' => [
                'totalSpent' => round($txSpent, 2),
                'totalEarned' => round($txEarned, 2),
                'disputeCount' => $disputeCount,
                'listingsCount' => Auction::where('seller_id', $user->id)->count(),
                'bidsCount' => Bid::where('bidder_id', $user->id)->count(),
            ],
        ]));
    }

    public function suspend(SuspendRequest $request, string $uuid): JsonResponse
    {
        $user = $this->findUser($uuid);
        $oldStatus = $user->status instanceof \BackedEnum ? $user->status->value : (string) $user->status;
        $user->status = 'suspended';
        $user->save();

        $this->recordAudit('suspend', $user, ['status' => $oldStatus], [
            'status' => 'suspended',
            'days' => $request->input('days', 7),
            'reason' => $request->input('reason'),
        ]);

        return ApiResponse::success($this->formatAdminUser($user), "User suspended for {$request->input('days', 7)} days");
    }

    public function ban(BanRequest $request, string $uuid): JsonResponse
    {
        $user = $this->findUser($uuid);
        $oldStatus = $user->status instanceof \BackedEnum ? $user->status->value : (string) $user->status;
        $user->status = 'banned';
        $user->save();
        $user->tokens()->delete();

        $this->recordAudit('ban', $user, ['status' => $oldStatus], [
            'status' => 'banned',
            'reason' => $request->input('reason'),
        ]);

        return ApiResponse::success($this->formatAdminUser($user), 'User banned permanently');
    }

    public function activate(Request $request, string $uuid): JsonResponse
    {
        $user = $this->findUser($uuid);
        $oldStatus = $user->status instanceof \BackedEnum ? $user->status->value : (string) $user->status;
        $user->status = 'active';
        $user->save();

        $this->recordAudit('update', $user, ['status' => $oldStatus], ['status' => 'active']);

        return ApiResponse::success($this->formatAdminUser($user), 'User activated');
    }

    public function impersonate(Request $request, string $uuid): JsonResponse
    {
        $this->authorize('impersonate', User::class);

        $target = $this->findUser($uuid);

        try {
            $token = $this->impersonationService->impersonate(auth()->user(), $target);
            return ApiResponse::success([
                'token' => $token,
                'accessToken' => $token,
                'user' => new \App\Http\Resources\User\UserResource($target),
            ], 'Impersonation started');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 403);
        }
    }

    public function stopImpersonating(Request $request): JsonResponse
    {
        $tokenName = $request->user()->currentAccessToken()?->name ?? '';
        $parts = explode(':', $tokenName);
        if (count($parts) === 3 && $parts[0] === 'impersonation') {
            $jti = $parts[2];
            $this->impersonationService->stopImpersonating($jti);
            $request->user()->currentAccessToken()->delete();
        }

        return ApiResponse::success(null, 'Impersonation stopped');
    }

    private function formatAdminUser(User $user): array
    {
        $displayName = $user->display_name ?: trim("{$user->first_name} {$user->last_name}") ?: $user->email;
        $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames()->values()->all() : [];
        if (empty($roles)) {
            $roles = ['buyer'];
        }

        $numericTier = $user->getNumericKycTier();
        $kycTierLabel = match ($numericTier) {
            3 => 'enhanced',
            2 => 'verified',
            1 => 'basic',
            default => 'none',
        };

        $rawStatus = $user->status instanceof \BackedEnum ? $user->status->value : (string) ($user->status ?? 'active');
        $status = in_array($rawStatus, ['active', 'suspended', 'banned', 'pending'], true) ? $rawStatus : 'active';

        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'name' => $displayName,
            'displayName' => $displayName,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'email' => $user->email,
            'avatarPath' => $user->avatar_path,
            'roles' => $roles,
            'kycTier' => $kycTierLabel,
            'status' => $status,
            'joinedAt' => ($user->member_since ?? $user->created_at)?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }

    private function findUser(string $uuid): User
    {
        return User::where('uuid', $uuid)
            ->when(is_numeric($uuid), fn ($q) => $q->orWhere('id', (int) $uuid))
            ->firstOrFail();
    }

    private function recordAudit(string $action, User $subject, ?array $oldValues, ?array $newValues): void
    {
        try {
            AuditLog::create([
                'action' => $action,
                'subject_type' => User::class,
                'subject_id' => $subject->id,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'actor_id' => auth()->id(),
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
        }
    }
}
