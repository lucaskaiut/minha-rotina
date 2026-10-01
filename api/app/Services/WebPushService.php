<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    /**
     * Envia uma notificação Web Push para todos os dispositivos do usuário.
     */
    public function send(User $user, array $payload): void
    {
        $publicKey = (string) config('rotina.vapid.public');
        $privateKey = (string) config('rotina.vapid.private');

        if ($publicKey === '' || $privateKey === '') {
            return;
        }

        $subscriptions = $user->pushSubscriptions()->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => (string) config('rotina.vapid.subject'),
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

        /** @var PushSubscription $subscription */
        foreach ($subscriptions as $subscription) {
            $keys = $subscription->subscription_keys ?? [];

            if (empty($keys['p256dh']) || empty($keys['auth'])) {
                continue;
            }

            $webPush->queueNotification(
                new Subscription($subscription->endpoint, $keys['p256dh'], $keys['auth']),
                $json,
            );
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                continue;
            }

            $status = $report->getResponse()?->getStatusCode();

            if (in_array($status, [404, 410], true)) {
                PushSubscription::query()->where('endpoint', $report->getEndpoint())->delete();
            }
        }
    }
}
