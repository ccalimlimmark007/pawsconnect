<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
        $this->configureDefaults();
        $this->configureRateLimiters();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureRateLimiters(): void
    {
        // Adoption application submissions: 5 per hour per authenticated user
        RateLimiter::for('applications', function (Request $request) {
            return $request->user()
                ? Limit::perHour(5)->by('app:' . $request->user()->id)
                : Limit::perHour(10)->by('app:ip:' . $request->ip());
        });

        // Pet listings posted by shelter staff: 10 per hour per user
        RateLimiter::for('pet-posting', function (Request $request) {
            return Limit::perHour(10)->by('pet:' . ($request->user()?->id ?? $request->ip()));
        });

        // Favorites toggle: flood protection — 60 per minute per user/IP
        RateLimiter::for('favorites', function (Request $request) {
            return Limit::perMinute(60)->by('fav:' . ($request->user()?->id ?? $request->ip()));
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
