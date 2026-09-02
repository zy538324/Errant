<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class PrintOrder extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'PrintOrder';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'orderId', 'customerId', 'artworkId', 'provider', 'providerOrderId',
        'sku', 'variant', 'quantity', 'unitPence', 'shipTo', 'status', 'trackingUrl', 'providerPayload',
    ];

    protected $casts = [
        'unitPence' => 'integer',
        'quantity' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function artwork()
    {
        return $this->belongsTo(Artwork::class, 'artworkId', 'id');
    }
}
