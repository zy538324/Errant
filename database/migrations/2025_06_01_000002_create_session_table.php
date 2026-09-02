<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Session', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId');
            $table->string('tokenHash')->unique();
            $table->timestamp('expiresAt');
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('userId')->references('id')->on('User')->onDelete('cascade');
            $table->index(['userId', 'expiresAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Session');
    }
};
