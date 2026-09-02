<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('CustomerLoginCode', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId');
            $table->string('email');
            $table->string('codeHash');
            $table->timestamp('expiresAt');
            $table->timestamp('consumedAt')->nullable();
            $table->integer('attempts')->default(0);
            $table->string('ipAddress')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('userId')->references('id')->on('User')->onDelete('cascade');
            $table->index(['email', 'createdAt']);
            $table->index(['userId', 'expiresAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('CustomerLoginCode');
    }
};
