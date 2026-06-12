<?php

namespace App\Contracts\Auth;

use App\Models\KycDocument;

interface IKycRepository
{
    public function create(array $data): KycDocument;
    public function update(KycDocument $document, array $data): bool;
    public function findById(int $id): ?KycDocument;
    public function findByUuid(string $uuid): ?KycDocument;
}
