<?php

namespace App\Services;

use App\Jobs\SendWebPushJob;
use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    /**
     * Cria a notificação in-app e agenda o envio do Web Push.
     */
    public function create(
        User $target,
        string $recipient,
        string $title,
        string $message,
        string $type,
        bool $push = true,
    ): AppNotification {
        $notification = AppNotification::query()->create([
            'family_id' => $target->family_id,
            'user_id' => $target->id,
            'recipient' => $recipient,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'read' => false,
        ]);

        if ($push) {
            SendWebPushJob::dispatch($target->id, [
                'title' => $title,
                'body' => $message,
                'tag' => 'mr-'.$notification->public_id,
                'data' => [
                    'notificationId' => $notification->public_id,
                    'type' => $type,
                ],
            ]);
        }

        return $notification;
    }
}
