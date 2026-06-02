<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Copy existing image_url values into pet_images as primary images
        $now = now();
        DB::table('pets')
            ->whereNotNull('image_url')
            ->orderBy('id')
            ->each(function ($pet) use ($now) {
                DB::table('pet_images')->insert([
                    'pet_id'     => $pet->id,
                    'url'        => $pet->image_url,
                    'is_primary' => true,
                    'order'      => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });

        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->string('image_url')->nullable();
        });

        // Restore image_url from primary pet_images
        DB::table('pet_images')
            ->where('is_primary', true)
            ->orderBy('pet_id')
            ->each(function ($img) {
                DB::table('pets')->where('id', $img->pet_id)->update(['image_url' => $img->url]);
            });
    }
};
