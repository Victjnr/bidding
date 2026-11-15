<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Presence channel for auction bidding rooms — must return user info array
Broadcast::channel('auction.{uuid}', function (User $user, string $uuid) {
    return [
        'id' => $user->uuid,
        'uuid' => $user->uuid,
        'name' => $user->display_name ?? trim("{$user->first_name} {$user->last_name}"),
    ];
});

// Users can only listen to their own private channel (by id or uuid)
Broadcast::channel('user.{id}', function (User $user, $id) {
    return (string) $user->id === (string) $id || (string) $user->uuid === (string) $id;
});

Broadcast::channel('notifications.{id}', function (User $user, $id) {
    return (string) $user->uuid === (string) $id || (string) $user->id === (string) $id;
});

Broadcast::channel('conversation.{id}', function (User $user, $id) {
    $conversation = Conversation::where('uuid', $id)
        ->when(is_numeric($id), fn($q) => $q->orWhere('id', (int) $id))
        ->first();

    if (!$conversation) {
        return false;
    }

    return (int) $conversation->buyer_id === (int) $user->id
        || (int) $conversation->seller_id === (int) $user->id;
});
