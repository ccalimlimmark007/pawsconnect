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
        Schema::table('pets', function (Blueprint $table) {
            $table->string('color')->nullable()->after('size');
            $table->decimal('weight', 8, 2)->nullable()->after('color');
            $table->boolean('is_vetted')->default(true)->after('medical_status');
            $table->boolean('availability_status')->default(true)->after('is_vetted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['color', 'weight', 'is_vetted', 'availability_status']);
        });
    }
};
