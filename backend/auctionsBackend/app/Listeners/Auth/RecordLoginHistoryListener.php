<?php
namespace App\Listeners\Auth;
use App\Events\Auth\UserLoggedIn;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
class RecordLoginHistoryListener implements ShouldQueue {
    use InteractsWithQueue;
    public function handle(UserLoggedIn $event): void {
        // Record login history logic here
    }
}
