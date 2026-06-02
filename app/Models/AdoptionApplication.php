<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AdoptionApplication extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'notes', 'rejected_reason', 'reviewed_by'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'pet_id',
        'dedup_key',
        'status',
        'started_at',
        'home_type',
        'has_yard',
        'has_children',
        'has_other_pets',
        'other_pets_description',
        'work_hours_per_day',
        'reason_for_adopting',
        'prior_pet_experience',
        'references',
        'notes',
        'rejected_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'started_at'         => 'datetime',
            'reviewed_at'        => 'datetime',
            'has_yard'           => 'boolean',
            'has_children'       => 'boolean',
            'has_other_pets'     => 'boolean',
            'work_hours_per_day' => 'integer',
            'references'         => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function homeVisit(): HasOne
    {
        return $this->hasOne(HomeVisit::class, 'adoption_application_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class, 'adoption_application_id')->orderBy('created_at');
    }
}
