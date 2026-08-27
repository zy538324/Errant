<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'AuditLog';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'userId', 'action', 'entityType', 'entityId', 'metadataJson', 'createdAt',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }
}
