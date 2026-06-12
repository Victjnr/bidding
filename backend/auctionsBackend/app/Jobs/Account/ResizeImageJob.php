<?php

namespace App\Jobs\Account;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ResizeImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $tempPath,
        public string $finalPath,
    ) {}

    public function handle(): void
    {
        try {
            $disk = Storage::disk('local');

            if (!$disk->exists($this->tempPath)) {
                Log::error("ResizeImageJob: temp file not found at {$this->tempPath}");
                return;
            }

            $absolutePath = $disk->path($this->tempPath);

            // Attempt to use GD library for resizing
            $info = getimagesize($absolutePath);
            if (!$info) {
                Log::error("ResizeImageJob: unable to read image info for {$this->tempPath}");
                return;
            }

            $src = match ($info['mime']) {
                'image/jpeg', 'image/jpg' => imagecreatefromjpeg($absolutePath),
                'image/png' => imagecreatefrompng($absolutePath),
                'image/webp' => imagecreatefromwebp($absolutePath),
                default => null,
            };

            if (!$src) {
                Log::error("ResizeImageJob: unsupported MIME {$info['mime']}");
                return;
            }

            $sizes = [256, 512];
            foreach ($sizes as $size) {
                $dst = imagecreatetruecolor($size, $size);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $size, $size, $info[0], $info[1]);

                $sizeDir = dirname($this->finalPath);
                $baseName = pathinfo($this->finalPath, PATHINFO_FILENAME);
                $outputRelative = "{$sizeDir}/{$baseName}_{$size}.webp";
                $outputAbsolute = $disk->path($outputRelative);

                // Ensure directory exists
                if (!is_dir(dirname($outputAbsolute))) {
                    mkdir(dirname($outputAbsolute), 0755, true);
                }

                imagewebp($dst, $outputAbsolute, 85);
                imagedestroy($dst);
            }

            imagedestroy($src);

            // Copy the 256 variant as the "default" avatar path
            $default256 = dirname($this->finalPath) . '/' . pathinfo($this->finalPath, PATHINFO_FILENAME) . '_256.webp';
            if ($disk->exists($default256)) {
                $disk->copy($default256, $this->finalPath);
            }

            // Clean up temp
            $disk->delete($this->tempPath);

        } catch (\Exception $e) {
            Log::error("ResizeImageJob failed: " . $e->getMessage());
        }
    }
}
