<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adoption_applications', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('references');
            $table->text('rejected_reason')->nullable()->after('notes');
            $table->foreignId('reviewed_by')->nullable()->after('rejected_reason')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('adoption_applications', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['notes', 'rejected_reason', 'reviewed_by', 'reviewed_at']);
        });
    }
};
