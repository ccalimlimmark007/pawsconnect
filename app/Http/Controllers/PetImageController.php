<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\PetImage;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PetImageController extends Controller
{
    /**
     * Upload a new image for a pet.
     * Accepts a file (`image`) or a URL (`image_url`).
     */
    public function store(Request $request, Pet $pet): RedirectResponse
    {
        $this->authorizeStaff($request->user(), $pet);

        $request->validate([
            'image'     => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'image_url' => ['nullable', 'url', 'max:2048'],
        ]);

        if (! $request->hasFile('image') && ! $request->filled('image_url')) {
            return redirect()->back()->withErrors(['image' => 'Provide an image file or URL.']);
        }

        if ($request->hasFile('image')) {
            $disk = config('filesystems.upload_disk');
            $path = $request->file('image')->store('pet-images', $disk);
            $url  = $disk === 'public'
                ? '/storage/' . $path
                : Storage::disk($disk)->url($path);
        } else {
            $url = $request->input('image_url');
        }

        $count     = $pet->petImages()->count();
        $isPrimary = ($count === 0); // auto-primary if first image
        $order     = $count;

        $pet->petImages()->create([
            'url'        => $url,
            'is_primary' => $isPrimary,
            'order'      => $order,
        ]);

        return redirect()->back()->with('status', 'Image added.');
    }

    /**
     * Delete a pet image. Reassigns primary if needed.
     */
    public function destroy(Request $request, PetImage $image): RedirectResponse
    {
        $pet = $image->pet;
        $this->authorizeStaff($request->user(), $pet);

        $this->deleteStoredFile($image->url);

        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $pet->petImages()->orderBy('order')->first()?->update(['is_primary' => true]);
        }

        return redirect()->back()->with('status', 'Image removed.');
    }

    /**
     * Set an image as the primary image for its pet.
     */
    public function setPrimary(Request $request, PetImage $image): RedirectResponse
    {
        $this->authorizeStaff($request->user(), $image->pet);

        $image->pet->petImages()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return redirect()->back()->with('status', 'Primary image updated.');
    }

    /**
     * Reorder images by accepting an ordered array of image IDs.
     */
    public function reorder(Request $request, Pet $pet): RedirectResponse
    {
        $this->authorizeStaff($request->user(), $pet);

        $request->validate([
            'order'   => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        foreach ($request->input('order') as $index => $imageId) {
            $pet->petImages()->where('id', (int) $imageId)->update(['order' => $index]);
        }

        return redirect()->back()->with('status', 'Image order saved.');
    }

    private function deleteStoredFile(string $url): void
    {
        if (str_starts_with($url, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $url));
        } elseif (str_starts_with($url, 'http')) {
            $path = ltrim(parse_url($url, PHP_URL_PATH), '/');
            Storage::disk('s3')->delete($path);
        }
    }

    private function authorizeStaff(User $user, Pet $pet): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isShelterStaff() && (int) $pet->created_by === (int) $user->id) {
            return;
        }

        abort(403);
    }
}
