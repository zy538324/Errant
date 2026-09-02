<?php

namespace App\Models\Concerns;

/**
 * The reference Prisma schema uses createdAt/updatedAt column names.
 * This keeps Eloquent's automatic timestamp management working against
 * those same camelCase columns instead of Laravel's default snake_case ones.
 */
trait HasCamelTimestamps
{
    public function getCreatedAtColumn()
    {
        return 'createdAt';
    }

    public function getUpdatedAtColumn()
    {
        return 'updatedAt';
    }
}
