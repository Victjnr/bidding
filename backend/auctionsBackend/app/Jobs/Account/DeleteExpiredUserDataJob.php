<?php

namespace App\Jobs\Account;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeleteExpiredUserDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $retentionDays = config('gdpr.retention_days', 730);

        User::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays($retentionDays))
            ->each(function (User $user) {
                HardDeleteUserJob::dispatch($user);
                Log::info("Dispatched HardDeleteUserJob for soft-deleted user {$user->id}");
            });
    }
}
