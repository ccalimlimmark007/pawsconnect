<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add shelter_id (nullable during transition)
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->unsignedBigInteger('shelter_id')->nullable()->after('id');
        });

        // 2. Populate shelter_id via subquery (SQLite-compatible — no JOIN in UPDATE)
        DB::statement('
            UPDATE shelter_contacts
            SET shelter_id = (
                SELECT pets.shelter_id FROM pets WHERE pets.id = shelter_contacts.pet_id
            )
        ');

        // 3. Remove duplicates — keep the row with the smallest id per shelter_id
        DB::statement('
            DELETE FROM shelter_contacts
            WHERE shelter_id IS NOT NULL
              AND id NOT IN (
                  SELECT MIN(id) FROM shelter_contacts
                  WHERE shelter_id IS NOT NULL
                  GROUP BY shelter_id
              )
        ');

        // 4. Drop orphan rows whose pet had no shelter_id
        DB::table('shelter_contacts')->whereNull('shelter_id')->delete();

        // 5. Drop the old FK, unique index, and pet_id column
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->dropForeign(['pet_id']);
            $table->dropUnique('shelter_contacts_pet_id_unique');
            $table->dropColumn('pet_id');
        });

        // 6. Make shelter_id NOT NULL and add FK + unique constraint
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->unsignedBigInteger('shelter_id')->nullable(false)->change();
            $table->foreign('shelter_id')->references('id')->on('shelters')->cascadeOnDelete();
            $table->unique('shelter_id');
        });
    }

    public function down(): void
    {
        // 1. Re-add pet_id (nullable during transition)
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->unsignedBigInteger('pet_id')->nullable()->after('id');
        });

        // 2. Best-effort: assign the smallest pet id per shelter (SQLite-compatible)
        DB::statement('
            UPDATE shelter_contacts
            SET pet_id = (
                SELECT MIN(pets.id) FROM pets WHERE pets.shelter_id = shelter_contacts.shelter_id
            )
        ');

        // 3. Drop orphans that could not be matched to a pet
        DB::table('shelter_contacts')->whereNull('pet_id')->delete();

        // 4. Drop new shelter_id FK, unique index, and column
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->dropForeign(['shelter_id']);
            $table->dropUnique('shelter_contacts_shelter_id_unique');
            $table->dropColumn('shelter_id');
        });

        // 5. Enforce NOT NULL, add original FK and unique on pet_id
        Schema::table('shelter_contacts', function (Blueprint $table) {
            $table->unsignedBigInteger('pet_id')->nullable(false)->change();
            $table->foreign('pet_id')->references('id')->on('pets')->cascadeOnDelete();
            $table->unique('pet_id');
        });
    }
};
