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
        Schema::create('shelter_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained('pets')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('phone');
            $table->string('email');
            $table->string('website')->nullable();
            $table->text('address');
            $table->string('hours')->nullable();

            $table->timestamps();

            $table->unique('pet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shelter_contacts');
    }
};
