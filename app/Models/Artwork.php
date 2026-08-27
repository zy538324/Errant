<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Artwork extends Model
{
    protected $table = 'Artwork';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'description', 'status', 'category', 'tagsJson',
        'pricePence', 'currency', 'stockOnHand', 'widthPx', 'heightPx',
        'previewUrl', 'collectionId',
    ];

    public function collection()
    {
        return $this->belongsTo(Collection::class, 'collectionId', 'id');
    }

    public function assets()
    {
        return $this->hasMany(ArtworkAsset::class, 'artworkId', 'id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'artworkId', 'id');
    }

    public function entitlements()
    {
        return $this->hasMany(DownloadEntitlement::class, 'artworkId', 'id');
    }

    public function printOrders()
    {
        return $this->hasMany(PrintOrder::class, 'artworkId', 'id');
    }
}
