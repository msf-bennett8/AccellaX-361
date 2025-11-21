<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AcademySeeder extends Seeder
{
    public function run()
    {
        DB::table('academies')->insert([
            'name' => 'NextGen Multi-Sport Academy',
            'sport' => 'soccer',
            'location' => 'Nairobi, Kenya',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
