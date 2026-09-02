<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Artwork>
 */
class ArtworkFactory extends Factory
{
    public function definition(): array
    {
        $title = ucwords(fake()->unique()->words(3, true));

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'description' => fake()->paragraph(),
            'status' => 'PUBLISHED',
            'category' => fake()->randomElement(['Landscape', 'Architecture', 'Sport', 'Portrait']),
            'pricePence' => fake()->randomElement([1500, 2000, 2500, 3500, 5000]),
            'currency' => 'GBP',
            'stockOnHand' => null,
            'previewUrl' => 'https://picsum.photos/seed/'.Str::random(8).'/800/600',
        ];
    }
}
