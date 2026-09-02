<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;

class CustomerLoginCode extends Model
{
    use GeneratesStringId;
    protected $table = 'CustomerLoginCode';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'userId', 'email', 'codeHash', 'expiresAt', 'consumedAt', 'attempts', 'ipAddress', 'createdAt',
    ];

    protected $casts = [
        'expiresAt' => 'datetime',
        'consumedAt' => 'datetime',
        'createdAt' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }
}
