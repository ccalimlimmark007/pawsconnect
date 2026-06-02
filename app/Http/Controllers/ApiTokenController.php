<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiTokenController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Settings/ApiTokens', [
            'tokens' => $request->user()->tokens()
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($token) => [
                    'id'          => $token->id,
                    'name'        => $token->name,
                    'last_used'   => $token->last_used_at?->diffForHumans(),
                    'created_at'  => $token->created_at->toDateString(),
                ]),
            'newToken' => session('new_token'),
            'status'   => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
        ]);

        if ($request->user()->tokens()->count() >= 10) {
            return back()->withErrors(['name' => 'You have reached the maximum of 10 API tokens.']);
        }

        $token = $request->user()->createToken($validated['name']);

        return redirect()->route('api-tokens.index')
            ->with('new_token', $token->plainTextToken)
            ->with('status', 'Token created successfully. Copy it now — it will not be shown again.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $request->user()->tokens()->where('id', $id)->delete();

        return redirect()->route('api-tokens.index')
            ->with('status', 'Token revoked.');
    }
}
