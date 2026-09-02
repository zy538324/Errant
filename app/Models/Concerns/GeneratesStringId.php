<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Auto-generates a sortable, unique string primary key on create.
 *
 * The reference app (Errant-Arts / Prisma) uses cuid() ids. Laravel has no
 * native cuid generator, so we use ULIDs here instead: also a sortable,
 * unique, URL-safe string id, which is what every model/migration in this
 * app actually needs from the id (uniqueness + a string primary key).
 */
trait GeneratesStringId
{
    protected static function bootGeneratesStringId(): void
    {
        static::creating(function ($model) {
            $key = $model->getKeyName();

            if (empty($model->{$key})) {
                $model->{$key} = (string) Str::ulid();
            }
        });
    }
}
