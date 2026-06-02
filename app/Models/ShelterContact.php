<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShelterContact extends Model
{
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'shelter_id',
        'created_by',
        'name',
        'phone',
        'email',
        'website',
        'address',
        'hours',
        'structured_hours',
        'slot_duration_minutes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'structured_hours'      => 'array',
            'slot_duration_minutes' => 'integer',
        ];
    }

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
