<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ArtworkAsset', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('artworkId');
            $table->string('kind'); // ORIGINAL | PREVIEW | WATERMARKED_PREVIEW | DOWNLOAD_MASTER
            $table->string('storageKey')->unique();
            $table->string('mimeType');
            $table->unsignedBigInteger('bytes');
            $table->string('checksum')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('artworkId')->references('id')->on('Artwork')->onDelete('cascade');
            $table->index(['artworkId', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ArtworkAsset');
    }
};
