<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Contracts\Auth\IKycService;
use App\DTOs\Auth\ReviewKycDTO;
use App\DTOs\Auth\UploadKycDTO;
use App\Enums\KycDocumentType;
use App\Enums\KycStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\KycReviewRequest;
use App\Http\Requests\User\KycUploadRequest;
use App\Models\KycDocument;
use Illuminate\Http\JsonResponse;

class KycController extends Controller
{
    public function __construct(protected readonly IKycService $kycService)
    {
    }

    public function upload(KycUploadRequest $request): JsonResponse
    {
        $user = $request->user();
        $dto = new UploadKycDTO(
            $user->uuid,
            KycDocumentType::from($request->validated('type')),
            $request->file('file')
        );

        $document = $this->kycService->upload($dto);

        // Automatically elevate tier_0 users to tier_1 and grant seller role on upload so they can immediately list/bid
        if ($user->getNumericKycTier() < 1) {
            $user->update(['kyc_tier' => 'tier_1']);
            if (!$user->hasRole('seller')) {
                try {
                    $user->assignRole('seller');
                } catch (\Throwable) {
                }
            }
        }

        return ApiResponse::success([
            'id' => $document->id,
            'uuid' => $document->uuid,
            'type' => $document->type?->value ?? (string) $document->type,
            'status' => $document->status?->value ?? (string) $document->status,
            'rejectionReason' => $document->rejection_reason,
            'uploadedAt' => $document->created_at?->toIso8601String(),
            'reviewedAt' => $document->reviewed_at?->toIso8601String(),
        ], 'Document uploaded successfully', 201);
    }

    public function status(\Illuminate\Http\Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTier = $user->getNumericKycTier();

        $nextTierRequirements = [
            0 => 'Verify your email address',
            1 => 'Upload a government-issued ID document',
            2 => 'Complete biometric verification with a selfie',
            3 => 'All verification complete',
        ];

        $documents = KycDocument::where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'uuid' => $doc->uuid,
                'type' => $doc->type?->value ?? (string) $doc->type,
                'status' => $doc->status?->value ?? (string) $doc->status,
                'rejectionReason' => $doc->rejection_reason,
                'uploadedAt' => $doc->created_at?->toIso8601String(),
                'reviewedAt' => $doc->reviewed_at?->toIso8601String(),
            ]);

        $hasPendingDocument = KycDocument::where('user_id', $user->id)
            ->where('status', KycStatus::Pending)
            ->exists();

        if ($hasPendingDocument) {
            $status = 'pending';
        } elseif ($currentTier >= 1) {
            $status = 'approved';
        } else {
            $status = 'none';
        }

        $limits = match ($currentTier) {
            0 => ['maxBidAmount' => 500, 'canSell' => false, 'maxActiveListings' => 0],
            1 => ['maxBidAmount' => 10000, 'canSell' => true, 'maxActiveListings' => 10],
            2 => ['maxBidAmount' => 50000, 'canSell' => true, 'maxActiveListings' => 50],
            default => ['maxBidAmount' => 1000000, 'canSell' => true, 'maxActiveListings' => 500],
        };

        return ApiResponse::success([
            'kycTier' => $currentTier,
            'status' => $status,
            'currentTier' => $currentTier,
            'nextTierRequirement' => $nextTierRequirements[$currentTier] ?? 'All verification complete',
            'documents' => $documents,
            'limits' => $limits,
        ], 'Status fetched');
    }

    public function review(KycReviewRequest $request, KycDocument $doc): JsonResponse
    {
        $this->authorize('review', $doc);

        $dto = new ReviewKycDTO(
            $doc->uuid,
            KycStatus::from($request->validated('status')),
            $request->user()->uuid,
            $request->validated('rejection_reason')
        );

        $document = $this->kycService->review($dto);

        return ApiResponse::success(['uuid' => $document->uuid, 'status' => $document->status->value], 'Document reviewed');
    }
}
