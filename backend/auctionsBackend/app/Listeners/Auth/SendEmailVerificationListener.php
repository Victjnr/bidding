<?php
namespace App\Listeners\Auth;
use App\Events\Auth\UserRegistered;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
class SendEmailVerificationListener implements ShouldQueue {
    use InteractsWithQueue;
    public function handle(UserRegistered $event): void {
        // Send email verification logic here
    }
}
