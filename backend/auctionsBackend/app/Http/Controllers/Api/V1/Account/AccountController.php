<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Contracts\Account\IAccountService;
use App\DTOs\Account\ChangePasswordDTO;
use App\DTOs\Account\UpdateProfileDTO;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\AddressRequest;
use App\Http\Requests\Account\AvatarRequest;
use App\Http\Requests\Account\BidFilterRequest;
use App\Http\Requests\Account\ChangePasswordRequest;
use App\Http\Requests\Account\CloseAccountRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(
        protected readonly IAccountService $accountService
    ) {}

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success($request->user());
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $dto = new UpdateProfileDTO(
            displayName: $request->input('display_name'),
            bio: $request->input('bio'),
            phone: $request->input('phone'),
        );

        $user = $this->accountService->updateProfile($request->user(), $dto);
        return ApiResponse::success($user, 'Profile updated');
    }

    public function uploadAvatar(AvatarRequest $request): JsonResponse
    {
        $url = $this->accountService->uploadAvatar($request->user(), $request->file('avatar'));
        return ApiResponse::success(['avatar_url' => $url], 'Avatar uploaded');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $dto = new ChangePasswordDTO(
            currentPassword: $request->input('current_password'),
            newPassword: $request->input('new_password'),
        );

        $this->accountService->changePassword($request->user(), $dto);
        return ApiResponse::success(null, 'Password changed. You have been logged out of all sessions.');
    }

    public function activeSessions(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()->get()->map(fn($token) => [
            'id' => $token->id,
            'name' => $token->name,
            'last_used_at' => $token->last_used_at,
            'created_at' => $token->created_at,
        ]);

        return ApiResponse::success($tokens);
    }

    public function revokeSession(Request $request, int $id): JsonResponse
    {
        $this->accountService->revokeSession($request->user(), $id);
        return ApiResponse::success(null, 'Session revoked');
    }

    public function myBids(BidFilterRequest $request): JsonResponse
    {
        $query = $request->user()->bids()->with('auction:id,uuid,title,current_price,status,end_at');

        // Simplified filtering
        if ($request->input('status') === 'winning') {
            $query->whereHas('auction', fn($q) => $q->whereColumn('bids.amount', '=', 'auctions.current_price'));
        }

        $bids = $query->latest()->paginate($request->input('per_page', 20));
        return ApiResponse::success($bids);
    }

    public function watchlist(Request $request): JsonResponse
    {
        // Assuming a pivot table 'watchlists' with user_id, auction_id
        $watchlist = $request->user()->watchedAuctions()
            ->with(['media' => fn($q) => $q->where('is_primary', true)])
            ->paginate(20);

        return ApiResponse::success($watchlist);
    }

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->get();
        return ApiResponse::success($addresses);
    }

    public function storeAddress(AddressRequest $request): JsonResponse
    {
        // If marking as default, unset others
        if ($request->boolean('is_default')) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = $request->user()->addresses()->create($request->validated());
        return ApiResponse::success($address, 'Address added', 201);
    }

    public function updateAddress(AddressRequest $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        if ($request->boolean('is_default')) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address->update($request->validated());
        return ApiResponse::success($address, 'Address updated');
    }

    public function destroyAddress(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $address->delete();
        return ApiResponse::success(null, 'Address deleted');
    }

    public function requestDataExport(Request $request): JsonResponse
    {
        $this->accountService->requestDataExport($request->user());
        return ApiResponse::success(null, 'Data export request received. You will receive an email with a download link.');
    }

    public function closeAccount(CloseAccountRequest $request): JsonResponse
    {
        try {
            $this->accountService->closeAccount($request->user(), $request->input('confirmation_text'));
            return ApiResponse::success(null, 'Account closed. Your data will be retained for the legally required period.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 400);
        }
    }
}
