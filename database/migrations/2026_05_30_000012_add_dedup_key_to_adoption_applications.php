<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop blanket unique only if it still exists (safe to re-run)
        if (Schema::hasIndex('adoption_applications', 'adoption_applications_user_id_pet_id_unique')) {
            Schema::table('adoption_applications', function (Blueprint $table) {
                $table->dropUnique(['user_id', 'pet_id']);
            });
        }

        // Add dedup_key column only if it doesn't exist yet
        if (! Schema::hasColumn('adoption_applications', 'dedup_key')) {
            Schema::table('adoption_applications', function (Blueprint $table) {
                // NULL for rejected (allow multiple re-applications), pet_id for active
                $table->string('dedup_key')->nullable()->after('pet_id');
            });
        }

        // Backfill: CASE WHEN works in both MySQL/MariaDB and SQLite
        DB::table('adoption_applications')->update([
            'dedup_key' => DB::raw("CASE WHEN status = 'rejected' THEN NULL ELSE pet_id END"),
        ]);

        // Add partial unique only if not yet present
        if (! Schema::hasIndex('adoption_applications', 'adoption_applications_user_active_unique')) {
            Schema::table('adoption_applications', function (Blueprint $table) {
                // NULLs are never equal in a unique index, so rejected apps (dedup_key=NULL)
                // can coexist while active apps (dedup_key=pet_id) are unique per user.
                $table->unique(['user_id', 'dedup_key'], 'adoption_applications_user_active_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('adoption_applications', function (Blueprint $table) {
            $table->dropUnique('adoption_applications_user_active_unique');
            $table->dropColumn('dedup_key');
            $table->unique(['user_id', 'pet_id']);
        });
    }
};
