<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationDocument extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'adoption_application_id',
        'type',
        'path',
        'original_name',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(AdoptionApplication::class, 'adoption_application_id');
    }
}
