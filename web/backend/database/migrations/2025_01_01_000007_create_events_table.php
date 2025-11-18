<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->string('event_time', 50)->nullable();
            $table->enum('event_type', ['training', 'tournament', 'camp', 'meeting', 'fundraiser']);
            $table->enum('target_audience', ['all', 'parents', 'kids', 'coaches', 'age_group']);
            $table->string('age_group', 20)->nullable();
            $table->timestamps();
            
            $table->index(['academy_id', 'event_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};