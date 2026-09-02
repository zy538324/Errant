<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('MarketingCampaign', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('subject');
            $table->string('previewText')->nullable();
            $table->text('bodyText');
            $table->string('status')->default('DRAFT'); // DRAFT | SENDING | SENT | FAILED
            $table->string('fromEmail');
            $table->string('replyToEmail');
            $table->string('createdById')->nullable();
            $table->timestamp('sentAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('createdById')->references('id')->on('User')->onDelete('set null');
            $table->index(['status', 'createdAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('MarketingCampaign');
    }
};
