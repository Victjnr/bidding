<?php

namespace App\Jobs\Security;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ScanUploadedFileJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $disk,
        public string $filePath
    ) {}

    public function handle(): void
    {
        $disk = Storage::disk($this->disk);
        if (!$disk->exists($this->filePath)) {
            return;
        }

        $absolutePath = $disk->path($this->filePath);

        // Run clamdscan
        // Requires ClamAV daemon to be running on the server
        $process = new Process(['clamdscan', '--no-summary', $absolutePath]);
        $process->run();

        // clamdscan exit codes: 0 = OK, 1 = Virus found, 2 = Error
        if ($process->getExitCode() === 1) {
            // Malware detected!
            $disk->delete($this->filePath);
            
            Log::channel('security')->critical('Malware detected and deleted', [
                'file_path' => $this->filePath,
                'disk' => $this->disk,
                'clamav_output' => $process->getOutput(),
            ]);

            // Fire event so we can suspend user or notify admin
            // event(new \App\Events\Security\MalwareDetected($this->filePath));
        } elseif ($process->getExitCode() === 2) {
            Log::channel('security')->error('ClamAV scan error', [
                'file_path' => $this->filePath,
                'output' => $process->getOutput() . $process->getErrorOutput(),
            ]);
        }
    }
}
