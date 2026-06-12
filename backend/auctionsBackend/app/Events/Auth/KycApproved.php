<?php
namespace App\Events\Auth;
use App\Models\KycDocument;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
class KycApproved {
    use Dispatchable, SerializesModels;
    public function __construct(public KycDocument $document) {}
}
