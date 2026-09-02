<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $email = fake()->unique()->safeEmail();

        return [
            'email' => $email,
            'username' => Str::slug(explode('@', $email)[0]).'-'.fake()->unique()->numberBetween(1000, 9999),
            'passwordHash' => static::$password ??= Hash::make('password'),
            'role' => 'CUSTOMER',
            'mfaEnabled' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'ADMIN',
        ]);
    }
}
