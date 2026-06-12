<?php

namespace App\Contracts\Account;

use App\DTOs\Account\ChangePasswordDTO;
use App\DTOs\Account\UpdateProfileDTO;
use App\Models\User;
use Illuminate\Http\UploadedFile;

interface IAccountService
{
    public function updateProfile(User $user, UpdateProfileDTO $dto): User;
    public function uploadAvatar(User $user, UploadedFile $file): string;
    public function changePassword(User $user, ChangePasswordDTO $dto): void;
    public function revokeSession(User $user, int $tokenId): void;
    public function requestDataExport(User $user): void;
    public function closeAccount(User $user, string $confirmation): void;
}
