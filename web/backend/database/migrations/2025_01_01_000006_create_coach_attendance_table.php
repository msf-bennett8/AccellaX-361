<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained()->onDelete('cascade');
            $table->foreignId('coach_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['present', 'absent', 'late'])->default('present');
            $table->timestamp('marked_at')->useCurrent();
            $table->timestamps();
            
            $table->index(['session_id', 'coach_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_attendance');
    }
};