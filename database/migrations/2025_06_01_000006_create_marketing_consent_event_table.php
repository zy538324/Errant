<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('MarketingConsentEvent', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('subscriberId')->nullable();
            $table->string('customerId')->nullable();
            $table->string('email');
            $table->string('eventType'); // OPT_IN | UNSUBSCRIBE | SUPPRESS
            $table->string('source');
            $table->string('consentVersion')->nullable();
            $table->text('consentText')->nullable();
            $table->string('ipAddress')->nullable();
            $table->text('userAgent')->nullable();
            $table->text('metadataJson')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('subscriberId')->references('id')->on('EmailSubscriber')->onDelete('set null');
            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('set null');
            $table->index(['email', 'createdAt']);
            $table->index(['subscriberId', 'createdAt']);
            $table->index(['customerId', 'createdAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('MarketingConsentEvent');
    }
};
