<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;

class OrderItem extends Model
{
    use GeneratesStringId;
    protected $table = 'OrderItem';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'orderId', 'artworkId', 'unitPence', 'quantity', 'kind', 'printSku',
    ];

    protected $casts = [
        'unitPence' => 'integer',
        'quantity' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function artwork()
    {
        return $this->belongsTo(Artwork::class, 'artworkId', 'id');
    }
}
