<?php

namespace App\Jobs\Account;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HardDeleteUserJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $user
    ) {}

    public function handle(): void
    {
        try {
            $userId = $this->user->id;

            DB::transaction(function () use ($userId) {
                // Delete associated data
                DB::table('login_histories')->where('user_id', $userId)->delete();
                DB::table('addresses')->where('user_id', $userId)->delete();
                DB::table('notifications')->where('notifiable_id', $userId)
                    ->where('notifiable_type', User::class)->delete();
                DB::table('messages')->where('sender_id', $userId)->delete();
                DB::table('watchlists')->where('user_id', $userId)->delete();

                // KYC documents — delete files from local storage
                $kycDocs = DB::table('kyc_documents')->where('user_id', $userId)->get();
                foreach ($kycDocs as $doc) {
                    if ($doc->file_path && Storage::disk('local')->exists($doc->file_path)) {
                        Storage::disk('local')->delete($doc->file_path);
                    }
                }
                DB::table('kyc_documents')->where('user_id', $userId)->delete();

                // Avatar files
                if (Storage::disk('local')->exists("avatars/{$userId}")) {
                    Storage::disk('local')->deleteDirectory("avatars/{$userId}");
                }

                // Anonymise bids (keep for auction integrity)
                DB::table('bids')->where('user_id', $userId)->update([
                    'user_id' => null, // or keep with anonymised reference
                ]);

                // Anonymise transactions (keep for financial records)
                // seller_id and buyer_id references remain but user is gone
                // The PII was already anonymised during soft-delete

                // Hard-delete user (bypasses soft-delete)
                $this->user->forceDelete();
            });

            // Delete data export files
            if (Storage::disk('local')->exists("exports/{$userId}")) {
                Storage::disk('local')->deleteDirectory("exports/{$userId}");
            }

            Log::info("Hard-deleted all data for user {$userId}");

        } catch (\Exception $e) {
            Log::error("HardDeleteUserJob failed for user {$this->user->id}: " . $e->getMessage());
        }
    }
}
