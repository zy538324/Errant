<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('AuditLog', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId')->nullable();
            $table->string('action');
            $table->string('entityType');
            $table->string('entityId');
            $table->text('metadataJson')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            $table->foreign('userId')->references('id')->on('User')->onDelete('set null');
            $table->index(['entityType', 'entityId']);
            $table->index('createdAt');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('AuditLog');
    }
};
