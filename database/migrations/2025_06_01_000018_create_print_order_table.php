<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->string('status')->default('PENDING'); // PENDING | SUBMITTED | PRODUCING | SHIPPED | DELIVERED | CANCELLED | FAILED
            $table->string('trackingUrl')->nullable();
            $table->text('providerPayload')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('orderId')->references('id')->on('Order')->onDelete('cascade');
            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('restrict');
            $table->foreign('artworkId')->references('id')->on('Artwork')->onDelete('restrict');
            $table->index('orderId');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('PrintOrder');
    }
};
