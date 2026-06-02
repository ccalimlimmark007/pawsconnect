<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdopterProfile extends Model
{
    protected $fillable = [
        'user_id',
        'home_type',
        'has_yard',
        'activity_level',
        'experience_level',
        'preferred_species',
        'preferred_size',
    ];

    protected function casts(): array
    {
        return [
            'has_yard'          => 'boolean',
            'preferred_species' => 'array',
            'preferred_size'    => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
