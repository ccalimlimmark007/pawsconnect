<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\ShelterVisit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShelterAvailabilityController extends Controller
{
    /**
     * Hard business-hour boundaries.
     * All generated slots must start at or after OPEN and end at or before CLOSE.
     */
    private const BUSINESS_OPEN  = '08:00';
    private const BUSINESS_CLOSE = '17:00';

    /**
     * Default weekly schedule used when a shelter has not configured
     * structured_hours yet.  Weekdays 08:00–17:00, closed weekends.
     *
     * @var array<string, array{open: string, close: string}|null>
     */
    private const DEFAULT_HOURS = [
        'monday'    => ['open' => self::BUSINESS_OPEN, 'close' => self::BUSINESS_CLOSE],
        'tuesday'   => ['open' => self::BUSINESS_OPEN, 'close' => self::BUSINESS_CLOSE],
        'wednesday' => ['open' => self::BUSINESS_OPEN, 'close' => self::BUSINESS_CLOSE],
        'thursday'  => ['open' => self::BUSINESS_OPEN, 'close' => self::BUSINESS_CLOSE],
        'friday'    => ['open' => self::BUSINESS_OPEN, 'close' => self::BUSINESS_CLOSE],
        'saturday'  => null,
        'sunday'    => null,
    ];

    /**
     * Return available time slots for a given pet + date.
     *
     * GET /api/shelter-visits/available-slots?pet_id=1&date=2026-06-10
     *
     * Response:
     * {
     *   available: ["08:00","09:00",...],  // HH:MM start times still open
     *   slot_duration_minutes: 60,          // slot length; end = start + duration
     *   closed: bool,
     *   message: string|null
     * }
     */
    public function availableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'date'   => [
                'required',
                'date',
                'after_or_equal:today',
                'before:' . now()->addDays(61)->toDateString(),
            ],
        ]);

        $pet          = Pet::with('shelter.shelterContact')->findOrFail($validated['pet_id']);
        $contact      = $pet->shelter?->shelterContact;
        $slotDuration = (int) ($contact?->slot_duration_minutes ?? 60);

        $date     = Carbon::parse($validated['date']);
        $dayName  = strtolower($date->format('l'));
        $hoursMap = $contact?->structured_hours ?? self::DEFAULT_HOURS;
        $dayHours = $hoursMap[$dayName] ?? null;

        if ($dayHours === null) {
            return response()->json([
                'available'             => [],
                'slot_duration_minutes' => $slotDuration,
                'closed'                => true,
                'message'               => 'The shelter is closed on ' . $date->format('l') . 's.',
            ]);
        }

        // Clamp shelter hours to the hard business boundaries
        $effectiveOpen  = $this->laterOf($dayHours['open'],  self::BUSINESS_OPEN);
        $effectiveClose = $this->earlierOf($dayHours['close'], self::BUSINESS_CLOSE);

        $slots = $this->generateSlots($effectiveOpen, $effectiveClose, $slotDuration);

        $bookedTimes = ShelterVisit::where('pet_id', $pet->id)
            ->where('visit_date', $date->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->pluck('visit_time')
            ->map(fn (string $t) => substr($t, 0, 5))
            ->toArray();

        $available = array_values(
            array_filter($slots, fn (string $slot) => ! in_array($slot, $bookedTimes, true))
        );

        return response()->json([
            'available'             => $available,
            'slot_duration_minutes' => $slotDuration,
            'closed'                => false,
            'message'               => empty($available) ? 'No available slots for this date.' : null,
        ]);
    }

    /**
     * Return which dates in a given month are fully booked or closed.
     *
     * GET /api/shelter-visits/booked-dates?pet_id=1&month=2026-06
     *
     * Response: { booked_dates: string[], closed_days: string[] }
     */
    public function bookedDates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'month'  => ['required', 'date_format:Y-m'],
        ]);

        $pet          = Pet::with('shelter.shelterContact')->findOrFail($validated['pet_id']);
        $contact      = $pet->shelter?->shelterContact;
        $slotDuration = (int) ($contact?->slot_duration_minutes ?? 60);

        /** @var array<string, array{open: string, close: string}|null> $hoursMap */
        $hoursMap   = $contact?->structured_hours ?? self::DEFAULT_HOURS;
        $closedDays = array_keys(array_filter($hoursMap, fn ($h) => $h === null));

        $monthStart = Carbon::parse($validated['month'] . '-01')->startOfDay();
        $monthEnd   = $monthStart->copy()->endOfMonth()->startOfDay();
        $today      = now()->startOfDay();
        $maxAllowed = now()->addDays(60)->startOfDay();

        // Pre-load all booked slots in this month in a single query
        $bookedByDay = ShelterVisit::where('pet_id', $pet->id)
            ->whereBetween('visit_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->whereIn('status', ['pending', 'confirmed'])
            ->selectRaw('visit_date, COUNT(*) as booked_count')
            ->groupBy('visit_date')
            ->pluck('booked_count', 'visit_date');

        $bookedDates = [];

        for ($day = $monthStart->copy(); $day->lte($monthEnd); $day->addDay()) {
            if ($day->lt($today) || $day->gt($maxAllowed)) {
                continue;
            }

            $dayName  = strtolower($day->format('l'));
            $dayHours = $hoursMap[$dayName] ?? null;

            if ($dayHours === null) {
                continue;
            }

            $effectiveOpen  = $this->laterOf($dayHours['open'],  self::BUSINESS_OPEN);
            $effectiveClose = $this->earlierOf($dayHours['close'], self::BUSINESS_CLOSE);
            $totalSlots     = count($this->generateSlots($effectiveOpen, $effectiveClose, $slotDuration));
            $bookedCount    = (int) ($bookedByDay[$day->toDateString()] ?? 0);

            if ($totalSlots > 0 && $bookedCount >= $totalSlots) {
                $bookedDates[] = $day->toDateString();
            }
        }

        return response()->json([
            'booked_dates' => $bookedDates,
            'closed_days'  => $closedDays,
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Generate HH:MM start times from $open up to the last slot that fits before $close.
     * Example: open=08:00, close=17:00, duration=60 → ["08:00","09:00",...,"16:00"]
     * Example: open=08:00, close=17:00, duration=30 → ["08:00","08:30",...,"16:30"]
     *
     * @return list<string>
     */
    private function generateSlots(string $open, string $close, int $durationMinutes): array
    {
        if ($durationMinutes <= 0) {
            return [];
        }

        $slots   = [];
        $current = Carbon::createFromFormat('H:i', $open);
        // Last valid start: the slot must finish at or before close
        $last    = Carbon::createFromFormat('H:i', $close)->subMinutes($durationMinutes);

        while ($current->lte($last)) {
            $slots[] = $current->format('H:i');
            $current->addMinutes($durationMinutes);
        }

        return $slots;
    }

    /** Return the later of two HH:MM strings. */
    private function laterOf(string $a, string $b): string
    {
        return $a > $b ? $a : $b;
    }

    /** Return the earlier of two HH:MM strings. */
    private function earlierOf(string $a, string $b): string
    {
        return $a < $b ? $a : $b;
    }
}
