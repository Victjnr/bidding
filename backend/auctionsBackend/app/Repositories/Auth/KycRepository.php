<?php

namespace App\Repositories\Auth;

use App\Contracts\Auth\IKycRepository;
use App\Models\KycDocument;

class KycRepository implements IKycRepository
{
    public function create(array $data): KycDocument
    {
        return KycDocument::create($data);
    }

    public function update(KycDocument $document, array $data): bool
    {
        return $document->update($data);
    }

    public function findById(int $id): ?KycDocument
    {
        return KycDocument::find($id);
    }

    public function findByUuid(string $uuid): ?KycDocument
    {
        return KycDocument::where('uuid', $uuid)->first();
    }
}
