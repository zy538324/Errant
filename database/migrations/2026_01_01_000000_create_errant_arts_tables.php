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
            $table->string('role')->default('CUSTOMER');
            $table->boolean('mfaEnabled')->default(false);
            $table->string('mfaSecret')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('Session', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId');
            $table->string('tokenHash')->unique();
            $table->timestamp('expiresAt');
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('userId')->references('id')->on('User')->onDelete('cascade');
            $table->index(['userId', 'expiresAt']);
        });

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

        Schema::create('Customer', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId')->unique();
            $table->string('fullName')->nullable();
            $table->boolean('marketingConsent')->default(false);
            $table->timestamp('consentAt')->nullable();
            $table->boolean('retentionLocked')->default(false);

            $table->foreign('userId')->references('id')->on('User');
        });

        Schema::create('EmailSubscriber', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email')->unique();
            $table->string('customerId')->nullable()->unique();
            $table->string('status')->default('SUBSCRIBED');
            $table->string('consentSource')->nullable();
            $table->string('consentVersion')->nullable();
            $table->text('consentText')->nullable();
            $table->timestamp('consentedAt')->nullable();
            $table->timestamp('unsubscribedAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('set null');
            $table->index(['status', 'consentedAt']);
        });

        Schema::create('MarketingConsentEvent', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('subscriberId')->nullable();
            $table->string('customerId')->nullable();
            $table->string('email');
            $table->string('eventType');
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

        Schema::create('MarketingCampaign', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('subject');
            $table->string('previewText')->nullable();
            $table->text('bodyText');
            $table->string('status')->default('DRAFT');
            $table->string('fromEmail');
            $table->string('replyToEmail');
            $table->string('createdById')->nullable();
            $table->timestamp('sentAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('createdById')->references('id')->on('User')->onDelete('set null');
            $table->index(['status', 'createdAt']);
        });

        Schema::create('MarketingCampaignRecipient', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('campaignId');
            $table->string('subscriberId');
            $table->string('email');
            $table->string('status')->default('PENDING');
            $table->string('messageId')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('sentAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('campaignId')->references('id')->on('MarketingCampaign')->onDelete('cascade');
            $table->foreign('subscriberId')->references('id')->on('EmailSubscriber')->onDelete('restrict');
            $table->unique(['campaignId', 'subscriberId']);
            $table->index(['campaignId', 'status']);
            $table->index(['subscriberId', 'createdAt']);
        });

        Schema::create('Collection', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('coverAsset')->nullable();
            $table->integer('sortOrder')->default(0);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('Artwork', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status')->default('DRAFT');
            $table->string('category')->nullable();
            $table->text('tagsJson')->default('[]');
            $table->integer('pricePence');
            $table->string('currency')->default('GBP');
            $table->integer('stockOnHand')->nullable();
            $table->integer('widthPx')->nullable();
            $table->integer('heightPx')->nullable();
            $table->text('previewUrl')->nullable();
            $table->string('collectionId')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('collectionId')->references('id')->on('Collection');
            $table->index(['collectionId', 'status']);
        });

        Schema::create('ArtworkAsset', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('artworkId');
            $table->string('kind');
            $table->string('storageKey')->unique();
            $table->string('mimeType');
            $table->integer('bytes');
            $table->string('checksum')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('artworkId')->references('id')->on('Artwork');
            $table->index(['artworkId', 'kind']);
        });

        Schema::create('Order', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('customerId');
            $table->string('status')->default('PENDING');
            $table->string('stripeCheckoutId')->nullable()->unique();
            $table->string('stripePaymentIntentId')->nullable()->unique();
            $table->integer('totalPence');
            $table->string('currency')->default('GBP');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('customerId')->references('id')->on('Customer');
        });

        Schema::create('CustomerReview', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('customerId');
            $table->string('orderId')->nullable();
            $table->string('displayName');
            $table->integer('rating');
            $table->text('body');
            $table->string('status')->default('PENDING');
            $table->text('denialReason')->nullable();
            $table->timestamp('submittedAt')->useCurrent();
            $table->timestamp('approvedAt')->nullable();
            $table->timestamp('deniedAt')->nullable();
            $table->string('moderatedById')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('cascade');
            $table->foreign('orderId')->references('id')->on('Order')->onDelete('set null');
            $table->foreign('moderatedById')->references('id')->on('User')->onDelete('set null');
            $table->index(['customerId', 'status']);
            $table->index('orderId');
            $table->index(['status', 'submittedAt']);
        });

        Schema::create('OrderItem', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('orderId');
            $table->string('artworkId');
            $table->integer('unitPence');
            $table->integer('quantity')->default(1);
            $table->string('kind')->default('digital');
            $table->string('printSku')->nullable();

            $table->foreign('orderId')->references('id')->on('Order');
            $table->foreign('artworkId')->references('id')->on('Artwork');
            $table->index('orderId');
            $table->index('artworkId');
        });

        Schema::create('DownloadEntitlement', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('customerId');
            $table->string('orderId');
            $table->string('artworkId');
            $table->integer('maxDownloads')->default(5);
            $table->integer('downloadCount')->default(0);
            $table->timestamp('expiresAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('customerId')->references('id')->on('Customer');
            $table->foreign('orderId')->references('id')->on('Order');
            $table->foreign('artworkId')->references('id')->on('Artwork');
            $table->index(['customerId', 'orderId']);
        });

        Schema::create('BlogPost', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt');
            $table->text('content');
            $table->string('status')->default('DRAFT');
            $table->timestamp('publishedAt')->nullable();
            $table->string('authorId');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('authorId')->references('id')->on('User');
            $table->index(['status', 'publishedAt']);
        });

        Schema::create('AuditLog', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId')->nullable();
            $table->string('action');
            $table->string('entityType');
            $table->string('entityId');
            $table->text('metadataJson')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('userId')->references('id')->on('User');
        });

        Schema::create('PrintOrder', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('orderId');
            $table->string('customerId');
            $table->string('artworkId');
            $table->string('provider')->default('printful');
            $table->string('providerOrderId')->nullable();
            $table->string('sku');
            $table->string('variant');
            $table->integer('quantity')->default(1);
            $table->integer('unitPence');
            $table->text('shipTo');
            $table->string('status')->default('PENDING');
            $table->text('trackingUrl')->nullable();
            $table->text('providerPayload')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();

            $table->foreign('orderId')->references('id')->on('Order');
            $table->foreign('customerId')->references('id')->on('Customer');
            $table->foreign('artworkId')->references('id')->on('Artwork');
            $table->index('orderId');
            $table->index('status');
        });

        Schema::create('PrintProduct', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('provider')->default('printful');
            $table->string('providerSku')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('variantsJson')->default('[]');
            $table->integer('basePencePrice');
            $table->boolean('active')->default(true);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('SitePage', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('key');
            $table->string('title');
            $table->string('eyebrow')->nullable();
            $table->text('intro')->nullable();
            $table->text('body')->nullable();
            $table->text('imageUrl')->nullable();
            $table->string('seoTitle')->nullable();
            $table->text('seoDescription')->nullable();
            $table->text('metadataJson')->default('{}');
            $table->string('status')->default('PUBLISHED');
            $table->string('updatedById')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent();
        });

        Schema::create('PortfolioItem', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('collectionName')->nullable();
            $table->string('collectionSlug')->nullable();
            $table->text('groupsJson')->default('[]');
            $table->text('previewUrl')->nullable();
            $table->string('imageAlt')->nullable();
            $table->integer('sortOrder')->default(0);
            $table->string('status')->default('DRAFT');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('PortfolioItem');
        Schema::dropIfExists('SitePage');
        Schema::dropIfExists('PrintProduct');
        Schema::dropIfExists('PrintOrder');
        Schema::dropIfExists('AuditLog');
        Schema::dropIfExists('BlogPost');
        Schema::dropIfExists('DownloadEntitlement');
        Schema::dropIfExists('OrderItem');
        Schema::dropIfExists('CustomerReview');
        Schema::dropIfExists('Order');
        Schema::dropIfExists('ArtworkAsset');
        Schema::dropIfExists('Artwork');
        Schema::dropIfExists('Collection');
        Schema::dropIfExists('MarketingCampaignRecipient');
        Schema::dropIfExists('MarketingCampaign');
        Schema::dropIfExists('MarketingConsentEvent');
        Schema::dropIfExists('EmailSubscriber');
        Schema::dropIfExists('Customer');
        Schema::dropIfExists('CustomerLoginCode');
        Schema::dropIfExists('Session');
        Schema::dropIfExists('User');
    }
};
