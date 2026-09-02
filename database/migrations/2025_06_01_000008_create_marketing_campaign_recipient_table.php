<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('MarketingCampaignRecipient', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('campaignId');
            $table->string('subscriberId');
            $table->string('email');
            $table->string('status')->default('PENDING'); // PENDING | SENDING | SENT | FAILED | SKIPPED
            $table->string('messageId')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('sentAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('campaignId')->references('id')->on('MarketingCampaign')->onDelete('cascade');
            $table->foreign('subscriberId')->references('id')->on('EmailSubscriber')->onDelete('restrict');
            $table->unique(['campaignId', 'subscriberId']);
            $table->index(['campaignId', 'status']);
            $table->index(['subscriberId', 'createdAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('MarketingCampaignRecipient');
    }
};
