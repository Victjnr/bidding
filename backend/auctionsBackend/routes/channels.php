<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Any authenticated user can listen to auction channels (bidding, extensions, close)
Broadcast::channel('auction.{uuid}', function (User $user) {
    return true;
});

// Users can only listen to their own private channel (proxy exhausted, notifications)
Broadcast::channel('user.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});
