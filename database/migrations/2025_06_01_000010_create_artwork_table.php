<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Artwork', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status')->default('DRAFT'); // DRAFT | PUBLISHED | ARCHIVED
            $table->string('category')->nullable();
            $table->text('tagsJson')->default('[]');
            $table->integer('pricePence');
            $table->string('currency')->default('GBP');
            $table->integer('stockOnHand')->nullable();
            $table->integer('widthPx')->nullable();
            $table->integer('heightPx')->nullable();
            $table->string('previewUrl')->nullable();
            $table->string('collectionId')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('collectionId')->references('id')->on('Collection')->onDelete('set null');
            $table->index(['collectionId', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Artwork');
    }
};
