<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Customer', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId')->unique();
            $table->string('fullName')->nullable();
            $table->boolean('marketingConsent')->default(false);
            $table->timestamp('consentAt')->nullable();
            $table->boolean('retentionLocked')->default(false);

            $table->foreign('userId')->references('id')->on('User')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Customer');
    }
};
