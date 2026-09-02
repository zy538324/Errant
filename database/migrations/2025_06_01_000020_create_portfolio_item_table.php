<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('PortfolioItem', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('collectionName')->nullable();
            $table->string('collectionSlug')->nullable();
            $table->text('groupsJson')->default('[]');
            $table->string('previewUrl')->nullable();
            $table->string('imageAlt')->nullable();
            $table->integer('sortOrder')->default(0);
            $table->string('status')->default('DRAFT');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->index(['status', 'sortOrder']);
            $table->index('collectionSlug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('PortfolioItem');
    }
};
