<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'Order';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'customerId', 'status', 'stripeCheckoutId', 'stripePaymentIntentId', 'totalPence', 'currency',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'orderId', 'id');
    }

    public function entitlements()
    {
        return $this->hasMany(DownloadEntitlement::class, 'orderId', 'id');
    }

    public function printOrders()
    {
        return $this->hasMany(PrintOrder::class, 'orderId', 'id');
    }

    public function reviews()
    {
        return $this->hasMany(CustomerReview::class, 'orderId', 'id');
    }
}
