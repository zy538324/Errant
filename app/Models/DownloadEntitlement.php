<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;

class DownloadEntitlement extends Model
{
    use GeneratesStringId;
    protected $table = 'DownloadEntitlement';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'customerId', 'orderId', 'artworkId', 'maxDownloads', 'downloadCount', 'expiresAt', 'createdAt',
    ];

    protected $casts = [
        'expiresAt' => 'datetime',
        'createdAt' => 'datetime',
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
