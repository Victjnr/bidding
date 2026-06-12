<?php

namespace App\Jobs\Account;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use ZipArchive;

class GenerateDataExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $user
    ) {}

    public function handle(): void
    {
        try {
            $userId = $this->user->id;
            $exportDir = "exports/{$userId}";
            $disk = Storage::disk('local');

            // Ensure directory
            $disk->makeDirectory($exportDir);

            // Collect user data into JSON files
            $data = [
                'profile.json' => $this->user->makeHidden(['password', 'remember_token'])->toArray(),
                'auctions.json' => $this->user->auctions()->get()->toArray(),
                'bids.json' => $this->user->bids()->get()->toArray(),
                'notifications.json' => $this->user->notifications()->get()->toArray(),
            ];

            foreach ($data as $filename => $content) {
                $disk->put("{$exportDir}/{$filename}", json_encode($content, JSON_PRETTY_PRINT));
            }

            // Create ZIP
            $zipFilename = "data_export_{$userId}_" . now()->format('Ymd_His') . '.zip';
            $zipPath = $disk->path("{$exportDir}/{$zipFilename}");

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                foreach ($data as $filename => $_) {
                    $zip->addFile($disk->path("{$exportDir}/{$filename}"), $filename);
                }
                $zip->close();
            }

            // Clean up individual JSON files
            foreach (array_keys($data) as $filename) {
                $disk->delete("{$exportDir}/{$filename}");
            }

            // Generate a signed URL valid for 48 hours
            // For local disk on cPanel, we'll use a signed route instead
            $signedUrl = URL::temporarySignedRoute(
                'api.v1.user.download-export',
                now()->addHours(48),
                ['user' => $userId, 'file' => $zipFilename]
            );

            // Email the user the signed download link
            Mail::raw(
                "Your data export is ready. Download it within 48 hours:\n\n{$signedUrl}",
                function ($message) {
                    $message->to($this->user->email)
                        ->subject('Your Data Export is Ready');
                }
            );

            Log::info("Data export generated for user {$userId}: {$zipFilename}");

        } catch (\Exception $e) {
            Log::error("GenerateDataExportJob failed for user {$this->user->id}: " . $e->getMessage());
        }
    }
}
