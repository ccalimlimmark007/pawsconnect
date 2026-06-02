<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'adoption_application_id',
        'visit_date',
        'status',
        'assigned_staff_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(AdoptionApplication::class, 'adoption_application_id');
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }
}
