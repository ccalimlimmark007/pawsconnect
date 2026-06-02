<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shelter_contacts', function (Blueprint $table) {
            // Machine-readable hours per day-of-week.
            // Shape: {"monday": {"open": "09:00", "close": "17:00"}, "sunday": null, ...}
            // A null entry means the shelter is closed that day.
            $table->json('structured_hours')->nullable()->after('hours');

            // Duration of each visit slot in minutes (e.g. 60 → 1-hour slots).
            $table->unsignedSmallInteger('slot_duration_minutes')->default(60)->after('structured_hours');
        });
    }

    public function down(): void
    {
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->dropColumn(['structured_hours', 'slot_duration_minutes']);
        });
    }
};
