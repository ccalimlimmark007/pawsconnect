<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // FULLTEXT indexes are a MySQL feature; SQLite (used in local dev / CI) has no
        // equivalent ALTER TABLE syntax, so we skip it there.  In production (MySQL/MariaDB)
        // this adds a composite FULLTEXT index that backs the MATCH…AGAINST queries in
        // Pet::fullTextSearch() and Pet::orderByRelevance().
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE pets ADD FULLTEXT INDEX pets_fulltext (name, description, breed)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE pets DROP INDEX pets_fulltext');
    }
};
