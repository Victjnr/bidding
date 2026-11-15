<?php

namespace App\Services\Auth;

use App\Contracts\Auth\IKycRepository;
use App\Contracts\Auth\IKycService;
use App\Contracts\Auth\IUserRepository;
use App\DTOs\Auth\ReviewKycDTO;
use App\DTOs\Auth\UploadKycDTO;
use App\Enums\KycStatus;
use App\Events\Auth\KycApproved;
use App\Events\Auth\KycDocumentUploaded;
use App\Events\Auth\KycRejected;
use App\Models\KycDocument;
use Illuminate\Support\Str;

class KycService implements IKycService
{
    public function __construct(
        protected readonly IKycRepository $kycRepository,
        protected readonly IUserRepository $userRepository
    ) {}

    public function upload(UploadKycDTO $dto): KycDocument
    {
        $filename = Str::uuid() . '.' . $dto->file->getClientOriginalExtension();
        $path = $dto->file->storeAs('kyc', $filename, 'local');

        $user = \App\Models\User::where('uuid', $dto->userId)->orWhere('id', $dto->userId)->first();
        $resolvedUserId = $user ? $user->id : $dto->userId;

        $document = $this->kycRepository->create([
            'user_id' => $resolvedUserId,
            'type' => $dto->type->value,
            'file_path' => $path,
            'status' => KycStatus::Pending->value,
        ]);

        // Dispatch ScanUploadedFileJob (ClamAV virus scan) here
        // dispatch(new \App\Jobs\ScanUploadedFileJob($document));

        event(new KycDocumentUploaded($document));

        return $document;
    }

    public function review(ReviewKycDTO $dto): KycDocument
    {
        $document = $this->kycRepository->findByUuid($dto->documentId);
        
        if (!$document) {
            abort(404, 'KYC Document not found.');
        }

        $this->kycRepository->update($document, [
            'status' => $dto->status->value,
            'reviewed_by' => $dto->reviewedBy,
            'rejection_reason' => $dto->rejectionReason,
        ]);

        if ($dto->status === KycStatus::Approved) {
            $user = $this->userRepository->findById($document->user_id);
            if ($user) {
                $this->userRepository->update($user, ['kyc_tier' => 'tier_2']);
                \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'web']);
                if (!$user->hasRole('seller')) {
                    $user->assignRole('seller');
                }
            }
            event(new KycApproved($document));
        } else if ($dto->status === KycStatus::Rejected) {
            event(new KycRejected($document));
        }

        return $document;
    }
}
