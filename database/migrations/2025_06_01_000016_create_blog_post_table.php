<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('BlogPost', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt');
            $table->longText('content');
            $table->string('status')->default('DRAFT'); // DRAFT | PUBLISHED
            $table->timestamp('publishedAt')->nullable();
            $table->string('authorId');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('authorId')->references('id')->on('User')->onDelete('restrict');
            $table->index(['status', 'publishedAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('BlogPost');
    }
};
