<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guard: if the table doesn't exist yet (happens in test environments where this
        // migration's filename sorts before create_pets_table), skip — the create migration
        // already includes these columns to ensure tests get a complete schema.
        if (! Schema::hasTable('pets') || Schema::hasColumn('pets', 'color')) {
            return;
        }

        Schema::table('pets', function (Blueprint $table) {
            $table->string('color')->nullable()->after('size');
            $table->decimal('weight', 8, 2)->nullable()->after('color');
            $table->boolean('is_vetted')->default(true)->after('medical_status');
            $table->boolean('availability_status')->default(true)->after('is_vetted');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('pets') || ! Schema::hasColumn('pets', 'color')) {
            return;
        }

        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['color', 'weight', 'is_vetted', 'availability_status']);
        });
    }
};
