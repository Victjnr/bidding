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
        $dto = new UploadKycDTO(
            $request->user()->uuid,
            KycDocumentType::from($request->validated('type')),
            $request->file('file')
        );

        $document = $this->kycService->upload($dto);

        return ApiResponse::success(['uuid' => $document->uuid], 'Document uploaded successfully', 201);
    }

    public function status(\Illuminate\Http\Request $request): JsonResponse
    {
        return ApiResponse::success([], 'Status fetched');
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
