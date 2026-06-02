<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adopter_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('home_type')->nullable();
            $table->boolean('has_yard')->nullable();
            $table->string('activity_level')->nullable();
            $table->string('experience_level')->nullable();
            $table->json('preferred_species')->nullable();
            $table->json('preferred_size')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adopter_profiles');
    }
};
