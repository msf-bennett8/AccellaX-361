<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // First, update any existing 'owner' records to 'admin'
        DB::table('users')->where('role', 'owner')->update(['role' => 'admin']);
        
        // Then modify the enum column
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'head_coach', 'coach', 'payment_recorder', 'parent', 'kid', 'sponsor') NOT NULL");
    }

    public function down(): void
    {
        // Revert 'admin' back to 'owner'
        DB::table('users')->where('role', 'admin')->update(['role' => 'owner']);
        
        // Revert enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'owner', 'head_coach', 'coach', 'payment_recorder', 'parent', 'kid', 'sponsor') NOT NULL");
    }
};