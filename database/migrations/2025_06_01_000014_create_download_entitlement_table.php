<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('DownloadEntitlement', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('customerId');
            $table->string('orderId');
            $table->string('artworkId');
            $table->integer('maxDownloads')->default(5);
            $table->integer('downloadCount')->default(0);
            $table->timestamp('expiresAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('customerId')->references('id')->on('Customer')->onDelete('cascade');
            $table->foreign('orderId')->references('id')->on('Order')->onDelete('cascade');
            $table->foreign('artworkId')->references('id')->on('Artwork')->onDelete('restrict');
            $table->index(['customerId', 'orderId']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('DownloadEntitlement');
    }
};
