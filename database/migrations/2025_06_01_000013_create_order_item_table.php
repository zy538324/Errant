<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('OrderItem', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('orderId');
            $table->string('artworkId');
            $table->integer('unitPence');
            $table->integer('quantity')->default(1);
            $table->string('kind')->default('digital'); // digital | print
            $table->string('printSku')->nullable();

            $table->foreign('orderId')->references('id')->on('Order')->onDelete('cascade');
            $table->foreign('artworkId')->references('id')->on('Artwork')->onDelete('restrict');
            $table->index('orderId');
            $table->index('artworkId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('OrderItem');
    }
};
