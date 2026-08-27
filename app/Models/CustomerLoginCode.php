<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerLoginCode extends Model
{
    protected $table = 'CustomerLoginCode';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'userId', 'email', 'codeHash', 'expiresAt', 'consumedAt', 'attempts', 'ipAddress', 'createdAt',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }
}
