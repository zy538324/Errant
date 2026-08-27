<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerReview extends Model
{
    protected $table = 'CustomerReview';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'customerId', 'orderId', 'displayName', 'rating', 'body', 'status',
        'denialReason', 'submittedAt', 'approvedAt', 'deniedAt', 'moderatedById',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function moderatedBy()
    {
        return $this->belongsTo(User::class, 'moderatedById', 'id');
    }
}
