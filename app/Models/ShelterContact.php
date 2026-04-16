<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShelterContact extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'pet_id',
        'created_by',
        'name',
        'phone',
        'email',
        'website',
        'address',
        'hours',
    ];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
