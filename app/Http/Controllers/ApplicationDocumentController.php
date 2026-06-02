<?php

namespace App\Http\Controllers;

use App\Models\AdoptionApplication;
use App\Models\ApplicationDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationDocumentController extends Controller
{
    /**
     * Upload additional documents to an existing application (post-submit additions).
     */
    public function store(Request $request, AdoptionApplication $application): RedirectResponse
    {
        $user = $request->user();

        // Adopters can only upload to their own applications
        if ($user->isAdopter() && (int) $application->user_id !== (int) $user->id) {
            abort(403);
        }

        $request->validate([
            'documents'         => ['required', 'array', 'min:1', 'max:5'],
            'documents.*'       => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'document_types'    => ['required', 'array', 'min:1'],
            'document_types.*'  => ['required', 'string', 'in:government_id,proof_of_income,reference_letter,other'],
        ]);

        self::persistDocuments($application, $request->file('documents'), $request->input('document_types', []));

        return redirect()->back()->with('status', 'Documents uploaded successfully.');
    }

    /**
     * Delete a document (and its file from storage).
     */
    public function destroy(ApplicationDocument $document, Request $request): RedirectResponse
    {
        $this->authorizeAccess($document, $request->user());

        Storage::disk('local')->delete($document->path);
        $document->delete();

        return redirect()->back()->with('status', 'Document removed.');
    }

    /**
     * Generate a 15-minute signed download URL and redirect to it.
     * Requires auth + ownership; the redirect target needs only the signature.
     */
    public function signedUrl(ApplicationDocument $document, Request $request): RedirectResponse
    {
        $this->authorizeAccess($document, $request->user());

        $url = URL::temporarySignedRoute(
            'documents.download',
            now()->addMinutes(15),
            ['document' => $document->id],
        );

        return redirect($url);
    }

    /**
     * Stream a file download. Requires a valid signed URL (no session needed).
     */
    public function download(ApplicationDocument $document, Request $request): StreamedResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired download link.');
        }

        if (! Storage::disk('local')->exists($document->path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Persist an array of uploaded files as ApplicationDocument records.
     *
     * @param  \Illuminate\Http\UploadedFile[]  $files
     * @param  string[]  $types
     */
    public static function persistDocuments(
        AdoptionApplication $application,
        array $files,
        array $types,
    ): void {
        foreach ($files as $index => $file) {
            $type = $types[$index] ?? 'other';
            $path = $file->store("documents/{$application->id}", 'local');

            $application->documents()->create([
                'type'          => $type,
                'path'          => $path,
                'original_name' => mb_strimwidth($file->getClientOriginalName(), 0, 255),
            ]);
        }
    }

    private function authorizeAccess(ApplicationDocument $document, \App\Models\User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isShelterStaff()) {
            $createdBy = optional($document->application?->pet)->created_by;
            if ((int) $createdBy !== (int) $user->id) {
                abort(403);
            }
            return;
        }

        if ($user->isAdopter()) {
            if ((int) optional($document->application)->user_id !== (int) $user->id) {
                abort(403);
            }
            return;
        }

        abort(403);
    }
}
