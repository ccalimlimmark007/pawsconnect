<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pet extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'created_by',
        'name',
        'species',
        'breed',
        'age',
        'age_unit',
        'gender',
        'size',
        'color',
        'weight',
        'medical_status',
        'is_vetted',
        'availability_status',
        'adoption_fee',
        'shelter_name',
        'image_url',
        'description',
        'temperament_tags',
        'photos',
        'personality_traits',
        'good_with',
        'not_good_with',
        'special_needs',
        'dietary_needs',
        'exercise_requirements',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'temperament_tags' => 'array',
            'photos' => 'array',
            'personality_traits' => 'array',
            'good_with' => 'array',
            'not_good_with' => 'array',
            'adoption_fee' => 'decimal:2',
            'weight' => 'decimal:2',
            'is_vetted' => 'boolean',
            'availability_status' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function shelterContact(): HasOne
    {
        return $this->hasOne(ShelterContact::class);
    }

    public function medicalRecords(): HasMany
    {
        return $this->hasMany(PetMedicalRecord::class);
    }
}
