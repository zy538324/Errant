<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Order', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('customerId');
            $table->string('status')->default('PENDING'); // PENDING | PAID | FULFILLED | REFUNDED | CANCELLED
            $table->string('stripeCheckoutId')->nullable()->unique();
            $table->string('stripePaymentIntentId')->nullable()->unique();
            $table->integer('totalPence');
            $table->string('currency')->default('GBP');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Order');
    }
};
