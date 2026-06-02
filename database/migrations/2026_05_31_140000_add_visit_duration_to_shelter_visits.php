<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shelter_visits', function (Blueprint $table) {
            // Duration of the booked slot in minutes (e.g. 60 or 30).
            // Captured from shelter_contacts.slot_duration_minutes at booking time
            // so the record is self-contained even if the shelter later changes its setting.
            $table->unsignedSmallInteger('visit_duration_minutes')->default(60)->after('visit_time');
        });
    }

    public function down(): void
    {
        Schema::table('shelter_visits', function (Blueprint $table) {
            $table->dropColumn('visit_duration_minutes');
        });
    }
};
