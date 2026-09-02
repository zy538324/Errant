<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;

/**
 * App-level auth session (opaque bearer token hash), distinct from
 * Laravel's own framework `sessions` table used by SESSION_DRIVER.
 */
class Session extends Model
{
    use GeneratesStringId;

    protected $table = 'Session';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'userId', 'tokenHash', 'expiresAt', 'createdAt',
    ];

    protected $casts = [
        'expiresAt' => 'datetime',
        'createdAt' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }
}
