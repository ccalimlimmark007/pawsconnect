<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShelterVisit extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'pet_id',
        'visit_date',
        'visit_time',
        'visit_duration_minutes',
        'message',
        'status',
        'confirmed_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'visit_date'             => 'date',
            'visit_time'             => 'string',
            'visit_duration_minutes' => 'integer',
            'confirmed_at'           => 'datetime',
            'cancelled_at'           => 'datetime',
            'status'                 => 'string',
        ];
    }

    /** Compute the visit end time as HH:MM from the stored start + duration. */
    public function getVisitEndTimeAttribute(): string
    {
        $start    = \Carbon\Carbon::createFromFormat('H:i', substr($this->visit_time, 0, 5));
        $duration = $this->visit_duration_minutes ?? 60;
        return $start->addMinutes($duration)->format('H:i');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('visit_date', '>=', today())
            ->where('status', '!=', 'cancelled');
    }
}
