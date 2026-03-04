<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['favorites' => []], 200);
        }

        $favorites = $user->favorites ? json_decode($user->favorites, true) : [];
        return response()->json(['favorites' => $favorites], 200);
    }

    public function toggle(Request $request)
    {
        $request->validate(['id' => 'required|string']);

        $user = Auth::user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $id = (string) $request->input('id');
        $favorites = $user->favorites ? json_decode($user->favorites, true) : [];
        if (! is_array($favorites)) $favorites = [];

        if (in_array($id, $favorites)) {
            $favorites = array_values(array_filter($favorites, fn($x) => $x !== $id));
            $action = 'removed';
        } else {
            $favorites[] = $id;
            $action = 'added';
        }

        $user->favorites = json_encode(array_values($favorites));
        $user->save();

        return response()->json(['favorites' => $favorites, 'action' => $action], 200);
    }
}
