<?php

namespace App\Services\Account;

use App\Contracts\Account\IAccountService;
use App\Contracts\Admin\IAuditService;
use App\DTOs\Account\ChangePasswordDTO;
use App\DTOs\Account\UpdateProfileDTO;
use App\Enums\AuctionStatus;
use App\Events\Account\AccountClosed;
use App\Events\Account\PasswordChanged;
use App\Events\Account\ProfileUpdated;
use App\Jobs\Account\GenerateDataExportJob;
use App\Jobs\Account\ResizeImageJob;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AccountService implements IAccountService
{
    public function __construct(
        protected readonly IAuditService $auditService
    ) {}

    public function updateProfile(User $user, UpdateProfileDTO $dto): User
    {
        $changedFields = [];

        // Whitelist-only update — never mass-assign from request
        $firstName = $dto->firstName === '' ? null : $dto->firstName;
        if ($firstName !== null && $firstName !== $user->first_name) {
            $changedFields['first_name'] = $firstName;
            $user->first_name = $firstName;
        }

        $lastName = $dto->lastName === '' ? null : $dto->lastName;
        if ($lastName !== null && $lastName !== $user->last_name) {
            $changedFields['last_name'] = $lastName;
            $user->last_name = $lastName;
        }

        $displayName = $dto->displayName === '' ? null : $dto->displayName;
        if ($displayName !== null && $displayName !== $user->display_name) {
            $changedFields['display_name'] = $displayName;
            $user->display_name = $displayName;
        }

        $bio = $dto->bio === '' ? null : $dto->bio;
        if ($bio !== null) {
            $changedFields['bio'] = $bio;
            $user->bio = $bio;
        }

        $phone = $dto->phone === '' ? null : $dto->phone;
        if ($phone !== null) {
            $changedFields['phone'] = $phone;
            $user->phone = $phone;
        }

        if (!empty($changedFields)) {
            $user->save();
            ProfileUpdated::dispatch($user, $changedFields);
        }

        return $user;
    }

    public function uploadAvatar(User $user, UploadedFile $file): string
    {
        // MIME validation via finfo (done in FormRequest, but double-check here)
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file->getRealPath());
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!in_array($mime, $allowedMimes)) {
            throw new \InvalidArgumentException("Invalid file type: {$mime}");
        }

        // Delete old avatar if exists
        if ($user->avatar_path && Storage::disk('local')->exists($user->avatar_path)) {
            Storage::disk('local')->delete($user->avatar_path);
        }

        $uuid = Str::uuid()->toString();
        $path = "avatars/{$user->id}/{$uuid}.webp";

        // Store original temporarily for the resize job
        $tempPath = $file->storeAs("avatars/{$user->id}/temp", "{$uuid}_original.{$file->getClientOriginalExtension()}", 'local');

        // Dispatch resize job to generate 256x256 + 512x512 WebP variants
        ResizeImageJob::dispatch($user, $tempPath, $path);

        // Update user record with the final expected path
        $user->avatar_path = $path;
        $user->save();

        return Storage::disk('local')->url($path);
    }

    public function changePassword(User $user, ChangePasswordDTO $dto): void
    {
        if (!Hash::check($dto->currentPassword, $user->password)) {
            throw new \InvalidArgumentException('Current password is incorrect.');
        }

        // bcrypt cost 12
        $user->password = Hash::make($dto->newPassword, ['rounds' => 12]);
        $user->save();

        // Revoke ALL Sanctum tokens (force re-login on all devices)
        $user->tokens()->delete();

        // Delete all refresh tokens from Cache
        Cache::forget("user:refresh_tokens:{$user->id}");

        PasswordChanged::dispatch($user);
    }

    public function revokeSession(User $user, int $tokenId): void
    {
        PersonalAccessToken::where('id', $tokenId)
            ->where('tokenable_id', $user->id)
            ->firstOrFail()
            ->delete();

        $this->auditService->log('session.revoked', null, [
            'new' => ['token_id' => $tokenId],
        ], $user);
    }

    public function requestDataExport(User $user): void
    {
        GenerateDataExportJob::dispatch($user);
    }

    public function closeAccount(User $user, string $confirmation): void
    {
        if ($confirmation !== 'DELETE') {
            throw new \InvalidArgumentException('Confirmation text must be "DELETE".');
        }

        // Validate no active auctions
        $activeAuctions = $user->auctions()
            ->whereIn('status', [AuctionStatus::Active, AuctionStatus::Pending])
            ->count();

        if ($activeAuctions > 0) {
            throw new \InvalidArgumentException('Cannot close account with active or pending auctions.');
        }

        // Validate no pending payments (simplified check)
        $pendingPayments = $user->transactions()
            ->whereIn('status', ['pending', 'processing'])
            ->count();

        if ($pendingPayments > 0) {
            throw new \InvalidArgumentException('Cannot close account with pending payments.');
        }

        // Anonymise PII
        $user->email = "deleted_{$user->id}@deleted.local";
        $user->first_name = 'Deleted';
        $user->last_name = 'User';
        $user->phone = null;
        $user->display_name = null;
        $user->bio = null;
        $user->save();

        // Revoke all tokens
        $user->tokens()->delete();

        // Soft-delete
        $user->delete();

        AccountClosed::dispatch($user);
    }
}
