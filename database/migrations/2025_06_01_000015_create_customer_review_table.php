<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('cascade');
            $table->foreign('orderId')->references('id')->on('Order')->onDelete('set null');
            $table->foreign('moderatedById')->references('id')->on('User')->onDelete('set null');
            $table->index(['customerId', 'status']);
            $table->index('orderId');
            $table->index(['status', 'submittedAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('CustomerReview');
    }
};
