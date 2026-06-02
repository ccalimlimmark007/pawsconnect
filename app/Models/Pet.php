<?php

namespace App\Models;

use App\Models\AdoptionApplication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Pet extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'species', 'breed', 'availability_status', 'adoption_fee', 'shelter_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

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
        'shelter_id',
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

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    public function medicalRecords(): HasMany
    {
        return $this->hasMany(PetMedicalRecord::class);
    }

    public function shelterVisits(): HasMany
    {
        return $this->hasMany(ShelterVisit::class);
    }

    public function petImages(): HasMany
    {
        return $this->hasMany(PetImage::class)->orderBy('order');
    }

    /** Primary image, or first by order when no primary is set. */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(PetImage::class)->where('is_primary', true)->orderBy('order');
    }

    public function adoptionApplications(): HasMany
    {
        return $this->hasMany(AdoptionApplication::class);
    }

    /**
     * Full-text search across name, description, and breed.
     *
     * MySQL: uses MATCH…AGAINST IN BOOLEAN MODE with prefix wildcards, backed by the
     *        pets_fulltext composite index (see migration 2026_05_31_000011).
     * SQLite: falls back to LIKE for local dev / CI parity.
     */
    public function scopeFullTextSearch(Builder $query, string $term): Builder
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            $boolTerm = self::toBooleanTerm($term);

            if ($boolTerm === '') {
                return $query;
            }

            return $query->whereRaw(
                'MATCH(name, description, breed) AGAINST (? IN BOOLEAN MODE)',
                [$boolTerm],
            );
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhere('breed', 'LIKE', "%{$term}%")
              ->orWhere('description', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Order by FULLTEXT relevance score (MySQL only; no-op on SQLite).
     * Call before any other orderBy so relevance is the primary sort key.
     */
    public function scopeOrderByRelevance(Builder $query, string $term): Builder
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            $boolTerm = self::toBooleanTerm($term);

            if ($boolTerm !== '') {
                $query->orderByRaw(
                    'MATCH(name, description, breed) AGAINST (? IN BOOLEAN MODE) DESC',
                    [$boolTerm],
                );
            }
        }

        return $query;
    }

    /**
     * Convert a raw user query into a MySQL FULLTEXT BOOLEAN MODE expression.
     * Each word becomes "word*" (prefix wildcard); special operators are stripped.
     */
    private static function toBooleanTerm(string $term): string
    {
        $sanitized = preg_replace('/[+\-><()*"@~]+/', ' ', $term) ?? '';
        $words     = preg_split('/\s+/', trim($sanitized), -1, PREG_SPLIT_NO_EMPTY);

        return implode(' ', array_map(fn (string $w) => "{$w}*", $words));
    }
}
