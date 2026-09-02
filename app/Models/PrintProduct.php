<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class PrintProduct extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'PrintProduct';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'provider', 'providerSku', 'name', 'description', 'variantsJson', 'basePencePrice', 'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}
