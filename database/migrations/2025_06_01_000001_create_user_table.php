<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('User', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email')->unique();
            $table->string('username')->unique();
            $table->string('passwordHash')->nullable();
            $table->string('role')->default('CUSTOMER'); // ADMIN | CUSTOMER
            $table->boolean('mfaEnabled')->default(false);
            $table->string('mfaSecret')->nullable();
            $table->rememberToken();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('User');
    }
};
