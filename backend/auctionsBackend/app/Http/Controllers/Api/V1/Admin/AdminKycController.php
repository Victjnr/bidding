<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\KycStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\KycDocument;
use Illuminate\Http\Request;

class AdminKycController extends Controller
{
    public function pendingQueue(Request $request)
    {
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $query = KycDocument::with('user')->orderBy('created_at', 'asc');

        $status = $request->input('status', 'pending');
        if ($status) {
            $query->where('status', $status);
        }

        $documents = $query->paginate($perPage);

        $items = collect($documents->items())->map(function (KycDocument $doc) {
            $user = $doc->user;
            $fullName = $user ? trim($user->first_name . ' ' . $user->last_name) : 'Unknown User';
            $currentTier = $user ? $user->getNumericKycTier() : 0;
            $docType = $doc->type?->value ?? (string) ($doc->type ?: 'id_card');
            $filePath = $doc->file_path ?? '';
            $fileUrl = $filePath
                ? (str_starts_with($filePath, 'http') ? $filePath : url('/storage/' . ltrim($filePath, '/')))
                : '';

            return [
                'id' => $doc->id,
                'uuid' => $doc->uuid,
                'userId' => $doc->user_id,
                'userUuid' => $user?->uuid ?? '',
                'userName' => $fullName,
                'userEmail' => $user?->email ?? '',
                'user' => $user ? [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'kyc_tier' => $user->kyc_tier,
                ] : null,
                'currentTier' => $currentTier,
                'requestedTier' => max(1, $currentTier + 1),
                'docType' => $docType,
                'documentType' => $docType,
                'type' => $docType,
                'fileUrl' => $fileUrl,
                'documentUrl' => $fileUrl,
                'selfieUrl' => null,
                'status' => $doc->status?->value ?? (string) $doc->status,
                'submittedAt' => $doc->created_at?->toIso8601String() ?? now()->toIso8601String(),
                'created_at' => $doc->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ];
        })->all();

        return ApiResponse::paginated($items, [
            'current_page' => $documents->currentPage(),
            'last_page' => $documents->lastPage(),
            'per_page' => $documents->perPage(),
            'total' => $documents->total(),
        ]);
    }

    public function approve(Request $request, $uuid)
    {
        $document = $this->findDocument($uuid);

        $document->update([
            'status' => KycStatus::Approved,
            'reviewed_by' => auth()->id() ?? 1,
            'reviewed_at' => now(),
        ]);

        if ($document->user) {
            $document->user->update(['kyc_tier' => 'tier_2']);
            try {
                \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'seller', 'guard_name' => 'web']);
                if (!$document->user->hasRole('seller')) {
                    $document->user->assignRole('seller');
                }
            } catch (\Throwable) {
            }
        }

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'kyc.approved',
            'subject_type' => KycDocument::class,
            'subject_id' => $document->id,
            'old_values' => ['status' => 'pending'],
            'new_values' => ['status' => 'approved', 'user_id' => $document->user_id],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Admin Web UI',
        ]);

        return ApiResponse::success([
            'document' => $document,
        ], 'KYC document approved successfully');
    }

    public function reject(Request $request, $uuid)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $document = $this->findDocument($uuid);
        $reason = $request->input('reason', 'Rejected by administrator');

        $document->update([
            'status' => KycStatus::Rejected,
            'reviewed_by' => auth()->id() ?? 1,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'kyc.rejected',
            'subject_type' => KycDocument::class,
            'subject_id' => $document->id,
            'old_values' => ['status' => 'pending'],
            'new_values' => ['status' => 'rejected', 'reason' => $reason],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Admin Web UI',
        ]);

        return ApiResponse::success([
            'document' => $document,
        ], 'KYC document rejected');
    }

    private function findDocument(string $uuid): KycDocument
    {
        return KycDocument::where('uuid', $uuid)
            ->when(is_numeric($uuid), fn ($q) => $q->orWhere('id', (int) $uuid))
            ->orWhereHas('user', fn ($q) => $q->where('uuid', $uuid))
            ->firstOrFail();
    }
}
