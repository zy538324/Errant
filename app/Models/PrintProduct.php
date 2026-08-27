<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrintProduct extends Model
{
    protected $table = 'PrintProduct';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'provider', 'providerSku', 'name', 'description', 'variantsJson', 'basePencePrice', 'active',
    ];
}
