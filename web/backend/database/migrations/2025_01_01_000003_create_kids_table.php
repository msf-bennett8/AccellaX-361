<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('name');
            $table->integer('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('area_of_residence')->nullable();
            $table->string('age_group', 20);
            $table->enum('sponsorship_type', ['SP', 'SC'])->default('SP');
            $table->enum('program_type', ['Elite', 'Weekend Warrior', 'Holiday Programme', 'Team Support']);
            $table->enum('status', ['active', 'suspended', 'inactive', 'expelled'])->default('active');
            $table->text('profile_story')->nullable();
            $table->text('family_background')->nullable();
            $table->string('firebase_id')->nullable()->unique();
            $table->boolean('firebase_synced')->default(false);
            $table->timestamps();
            
            $table->index(['academy_id', 'status']);
            $table->index(['age_group', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kids');
    }
};