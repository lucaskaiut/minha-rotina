<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Carbon;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Carbon::setLocale('pt_BR');

        ResetPassword::createUrlUsing(function (object $user, string $token): string {
            return rtrim((string) config('rotina.frontend_url'), '/')
                .'/redefinir-senha?token='.$token
                .'&email='.urlencode($user->getEmailForPasswordReset());
        });
    }
}
