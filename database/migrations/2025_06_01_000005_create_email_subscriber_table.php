<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('EmailSubscriber', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email')->unique();
            $table->string('customerId')->nullable()->unique();
            $table->string('status')->default('SUBSCRIBED'); // SUBSCRIBED | UNSUBSCRIBED | SUPPRESSED
            $table->string('consentSource')->nullable();
            $table->string('consentVersion')->nullable();
            $table->text('consentText')->nullable();
            $table->timestamp('consentedAt')->nullable();
            $table->timestamp('unsubscribedAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('set null');
            $table->index(['status', 'consentedAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('EmailSubscriber');
    }
};
