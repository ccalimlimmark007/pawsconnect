<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add shelter_id as nullable so we can populate it before enforcing NOT NULL.
        Schema::table('pets', function (Blueprint $table) {
            $table->unsignedBigInteger('shelter_id')->nullable()->after('adoption_fee');
            $table->foreign('shelter_id')->references('id')->on('shelters')->nullOnDelete();
        });

        // 2. For every distinct shelter_name, create one Shelter row and back-fill pets.
        $rows = DB::table('pets')
            ->select('shelter_name', DB::raw('MIN(created_by) as created_by'))
            ->whereNotNull('shelter_name')
            ->where('shelter_name', '!=', '')
            ->groupBy('shelter_name')
            ->get();

        foreach ($rows as $row) {
            $shelterId = DB::table('shelters')->insertGetId([
                'name'       => $row->shelter_name,
                'created_by' => $row->created_by,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('pets')
                ->where('shelter_name', $row->shelter_name)
                ->update(['shelter_id' => $shelterId]);
        }

        // 3. Handle any remaining pets that had a null/empty shelter_name.
        $orphans = DB::table('pets')->whereNull('shelter_id');
        if ($orphans->exists()) {
            $fallbackCreatedBy = DB::table('users')->value('id') ?? 1;
            $fallbackId = DB::table('shelters')
                ->where('name', 'Unknown Shelter')
                ->value('id');

            if (! $fallbackId) {
                $fallbackId = DB::table('shelters')->insertGetId([
                    'name'       => 'Unknown Shelter',
                    'created_by' => $fallbackCreatedBy,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $orphans->update(['shelter_id' => $fallbackId]);
        }

        // 4. Now that every pet has a shelter_id, enforce NOT NULL.
        Schema::table('pets', function (Blueprint $table) {
            $table->unsignedBigInteger('shelter_id')->nullable(false)->change();
        });

        // 5. Drop the old string column.
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn('shelter_name');
        });
    }

    public function down(): void
    {
        // Re-add the string column (nullable during restore).
        Schema::table('pets', function (Blueprint $table) {
            $table->string('shelter_name')->nullable()->after('adoption_fee');
        });

        // Restore shelter_name values from the shelters table.
        $pets = DB::table('pets')
            ->join('shelters', 'pets.shelter_id', '=', 'shelters.id')
            ->select('pets.id', 'shelters.name as shelter_name')
            ->get();

        foreach ($pets as $pet) {
            DB::table('pets')
                ->where('id', $pet->id)
                ->update(['shelter_name' => $pet->shelter_name]);
        }

        // Make shelter_name NOT NULL again and remove the FK column.
        Schema::table('pets', function (Blueprint $table) {
            $table->string('shelter_name')->nullable(false)->change();
            $table->dropForeign(['shelter_id']);
            $table->dropColumn('shelter_id');
        });
    }
};
