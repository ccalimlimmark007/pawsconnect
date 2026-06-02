<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/settings.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (
            \Illuminate\Http\Exceptions\ThrottleRequestsException $e,
            \Illuminate\Http\Request $request
        ) {
            $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 60);
            $minutes    = (int) ceil($retryAfter / 60);
            $message    = $minutes <= 1
                ? 'Too many requests. Please wait a moment before trying again.'
                : "Too many requests. Please wait {$minutes} minute(s) before trying again.";

            // JSON / API clients get a standard 429 payload with Retry-After header
            if ($request->expectsJson()) {
                return response()->json([
                    'message'     => $message,
                    'retry_after' => $retryAfter,
                ], 429, $e->getHeaders());
            }

            // Inertia form submissions: redirect back with a visible inline error so
            // the user sees the message without losing their work.
            // Non-Inertia web requests (e.g. Fortify login) get the default 429 response.
            if ($request->hasHeader('X-Inertia')) {
                return back()
                    ->withErrors(['throttle' => $message])
                    ->withInput();
            }
        });
    })->create();
