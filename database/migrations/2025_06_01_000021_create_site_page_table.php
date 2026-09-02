<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('SitePage', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('key')->unique();
            $table->string('title');
            $table->string('eyebrow')->nullable();
            $table->text('intro')->nullable();
            $table->longText('body')->nullable();
            $table->string('imageUrl')->nullable();
            $table->string('seoTitle')->nullable();
            $table->text('seoDescription')->nullable();
            $table->text('metadataJson')->nullable();
            $table->string('status')->default('DRAFT');
            $table->string('updatedById')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('updatedById')->references('id')->on('User')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('SitePage');
    }
};
