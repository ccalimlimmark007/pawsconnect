<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('species');
            $table->string('breed');
            $table->unsignedInteger('age');
            $table->string('age_unit')->default('years');
            $table->string('gender');
            $table->string('size');
            $table->string('medical_status');
            $table->decimal('adoption_fee', 10, 2)->default(0);
            $table->string('shelter_name');
            $table->string('image_url');
            $table->text('description');

            $table->json('temperament_tags')->nullable();
            $table->json('photos')->nullable();
            $table->json('personality_traits')->nullable();
            $table->json('good_with')->nullable();
            $table->json('not_good_with')->nullable();
            $table->text('special_needs')->nullable();
            $table->text('dietary_needs')->nullable();
            $table->text('exercise_requirements')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
