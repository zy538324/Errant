<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('PrintProduct');
    }
};
