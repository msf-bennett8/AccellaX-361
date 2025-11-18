<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained()->onDelete('cascade');
            $table->foreignId('coach_id')->constrained('users')->onDelete('cascade');
            $table->date('session_date');
            $table->string('session_time', 50);
            $table->string('age_group', 20);
            $table->text('general_notes')->nullable();
            $table->string('firebase_id')->nullable()->unique();
            $table->boolean('firebase_synced')->default(false);
            $table->timestamps();
            
            $table->index(['academy_id', 'session_date']);
            $table->index(['coach_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};