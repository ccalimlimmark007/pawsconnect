<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adoption_application_id')
                ->constrained('adoption_applications')
                ->cascadeOnDelete();
            $table->string('type');          // government_id | proof_of_income | reference_letter | other
            $table->string('path');          // storage path (local disk)
            $table->string('original_name'); // display filename
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_documents');
    }
};
