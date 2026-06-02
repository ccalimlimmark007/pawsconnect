<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'PawsConnect') }}</title>
        <meta name="description" content="Find your perfect pet companion through AI-powered matching. Connect with shelter pets that fit your lifestyle.">
        <meta name="author" content="PawsConnect">

        {{-- Open Graph / Social Media Meta Tags --}}
        <meta property="og:title" content="{{ config('app.name', 'PawsConnect') }}">
        <meta property="og:description" content="Find your perfect pet companion through AI-powered matching. Connect with shelter pets that fit your lifestyle.">
        <meta property="og:type" content="website">
        <meta property="og:image" content="https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=630&fit=crop">

        {{-- Twitter Card Meta Tags --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@PawsConnect">
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=630&fit=crop">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
