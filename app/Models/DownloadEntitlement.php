<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DownloadEntitlement extends Model
{
    protected $table = 'DownloadEntitlement';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'customerId', 'orderId', 'artworkId', 'maxDownloads', 'downloadCount', 'expiresAt', 'createdAt',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function artwork()
    {
        return $this->belongsTo(Artwork::class, 'artworkId', 'id');
    }
}
