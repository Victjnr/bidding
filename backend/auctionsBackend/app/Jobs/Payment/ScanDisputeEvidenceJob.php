<?php

namespace App\Jobs\Payment;

use App\Models\DisputeEvidence;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ScanDisputeEvidenceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $evidenceId
    ) {}

    public function handle(): void
    {
        $evidence = DisputeEvidence::find($this->evidenceId);
        if (!$evidence) return;

        // Note: For cPanel, you would typically execute clamscan here via shell_exec or a specialized PHP library.
        // Example: $result = shell_exec('clamscan ' . escapeshellarg(storage_path('app/' . $evidence->file_path)));
        
        // Mocking scan completion
        $isSafe = true; // In reality, parse $result to determine if 'Infected files: 0'

        $evidence->update([
            'is_scanned' => true,
            'is_safe' => $isSafe,
        ]);
        
        // If not safe, you might want to delete the file immediately or quarantine it.
    }
}
