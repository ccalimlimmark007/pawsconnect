<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PetImage extends Model
{
    use HasFactory;

    protected $fillable = ['pet_id', 'url', 'is_primary', 'order'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }
}
