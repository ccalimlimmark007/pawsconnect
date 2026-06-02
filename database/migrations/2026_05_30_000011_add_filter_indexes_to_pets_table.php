<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            // shelter_id already has an index from its FK constraint
            $table->index(['availability_status', 'created_at'], 'pets_availability_created_index');
            $table->index('species');
            $table->index('breed');
            $table->index('size');
            $table->index('gender');
            $table->index('adoption_fee');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropIndex('pets_availability_created_index');
            $table->dropIndex(['species']);
            $table->dropIndex(['breed']);
            $table->dropIndex(['size']);
            $table->dropIndex(['gender']);
            $table->dropIndex(['adoption_fee']);
        });
    }
};
