<?php

namespace App\Http\Requests;

use App\Models\Pet;
use App\Models\ShelterVisit;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreShelterVisitRequest extends FormRequest
{
    /** Hard business-hour boundaries mirrored from ShelterAvailabilityController. */
    private const BUSINESS_OPEN  = '08:00';
    private const BUSINESS_CLOSE = '17:00';

    public function authorize(): bool
    {
        return Auth::check();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'pet_id'     => [
                'required',
                'integer',
                Rule::exists('pets', 'id')->where('availability_status', true),
            ],
            'visit_date' => [
                'required',
                'date',
                'after_or_equal:today',
                'before:' . now()->addDays(61)->toDateString(),
            ],
            'visit_time' => ['required', 'date_format:H:i'],
            'message'    => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'visit_date.after_or_equal' => 'Visit date must be today or in the future.',
            'visit_date.before'         => 'Visit date cannot be more than 60 days from today.',
            'pet_id.exists'             => 'This pet is no longer available for visits.',
        ];
    }

    /**
     * Secondary validation that runs after field-level rules pass:
     *
     *  1. Hard business-hours gate — start must be ≥ 08:00 and
     *     start + duration must be ≤ 17:00 (prevents 4 PM booking
     *     with a 60-min slot overflowing past 5 PM, for example).
     *
     *  2. Shelter's own configured hours (structured_hours) are applied
     *     on top; the effective window is the intersection of both.
     *
     *  3. Slot uniqueness — the exact (pet, date, time) triple must not
     *     already be held by any user with pending/confirmed status.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }

            $petId     = $this->integer('pet_id');
            $visitDate = $this->string('visit_date')->toString();
            $visitTime = $this->string('visit_time')->toString();

            $pet          = Pet::with('shelter.shelterContact')->find($petId);
            $contact      = $pet?->shelter?->shelterContact;
            $slotDuration = (int) ($contact?->slot_duration_minutes ?? 60);

            // --- 1. Hard business-hours boundary ---------------------------------
            $start   = Carbon::createFromFormat('H:i', $visitTime);
            $endTime = $start->copy()->addMinutes($slotDuration);
            $bOpen   = Carbon::createFromFormat('H:i', self::BUSINESS_OPEN);
            $bClose  = Carbon::createFromFormat('H:i', self::BUSINESS_CLOSE);

            if ($start->lt($bOpen) || $endTime->gt($bClose)) {
                $v->errors()->add(
                    'visit_time',
                    'Visits must start at or after ' . self::BUSINESS_OPEN
                    . ' and finish by ' . self::BUSINESS_CLOSE . '.'
                );
                return;
            }

            // --- 2. Shelter's own configured hours --------------------------------
            $structuredHours = $contact?->structured_hours;

            if ($structuredHours !== null) {
                $date     = Carbon::parse($visitDate);
                $dayName  = strtolower($date->format('l'));
                $dayHours = $structuredHours[$dayName] ?? null;

                if ($dayHours === null) {
                    $v->errors()->add(
                        'visit_date',
                        'The shelter is closed on ' . $date->format('l') . 's.'
                    );
                    return;
                }

                if (isset($dayHours['open'], $dayHours['close'])) {
                    $shelterOpen  = Carbon::createFromFormat('H:i', $dayHours['open']);
                    $shelterClose = Carbon::createFromFormat('H:i', $dayHours['close']);
                    $slotEndTime  = $start->copy()->addMinutes($slotDuration);

                    if ($start->lt($shelterOpen) || $slotEndTime->gt($shelterClose)) {
                        $v->errors()->add(
                            'visit_time',
                            "Visit must start at or after {$dayHours['open']} and the session must finish by {$dayHours['close']}."
                        );
                        return;
                    }
                }
            }

            // --- 3. Slot uniqueness (any user) ------------------------------------
            $slotTaken = ShelterVisit::where('pet_id', $petId)
                ->where('visit_date', $visitDate)
                ->where('visit_time', $visitTime)
                ->whereIn('status', ['pending', 'confirmed'])
                ->exists();

            if ($slotTaken) {
                $v->errors()->add(
                    'visit_time',
                    'This time slot has already been booked. Please choose a different time.'
                );
            }
        });
    }
}
