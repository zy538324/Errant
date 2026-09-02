<?php

namespace Database\Seeders;

use App\Models\Artwork;
use App\Models\Collection;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Local/dev sample data. Never run against production — use the
     * `php artisan admin:create` command to create a real admin account instead.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@errant-arts.co.uk'],
            [
                'username' => 'admin',
                'passwordHash' => Hash::make('password'),
                'role' => 'ADMIN',
            ]
        );

        if (Collection::count() > 0) {
            return;
        }

        $collections = Collection::factory(3)->create();

        Artwork::factory(12)->create()->each(function (Artwork $artwork) use ($collections) {
            $artwork->update(['collectionId' => $collections->random()->id]);
        });
    }
}
