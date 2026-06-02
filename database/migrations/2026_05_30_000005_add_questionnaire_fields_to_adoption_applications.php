<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adoption_applications', function (Blueprint $table) {
            $table->string('home_type')->nullable();               // house | apartment | condo
            $table->boolean('has_yard')->nullable();
            $table->boolean('has_children')->nullable();
            $table->boolean('has_other_pets')->nullable();
            $table->text('other_pets_description')->nullable();
            $table->unsignedTinyInteger('work_hours_per_day')->nullable();
            $table->text('reason_for_adopting')->nullable();
            $table->text('prior_pet_experience')->nullable();
            $table->json('references')->nullable();                // [{name, relationship, contact}]
        });
    }

    public function down(): void
    {
        Schema::table('adoption_applications', function (Blueprint $table) {
            $table->dropColumn([
                'home_type',
                'has_yard',
                'has_children',
                'has_other_pets',
                'other_pets_description',
                'work_hours_per_day',
                'reason_for_adopting',
                'prior_pet_experience',
                'references',
            ]);
        });
    }
};
