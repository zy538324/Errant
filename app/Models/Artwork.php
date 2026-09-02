<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class Artwork extends Model
{
    use GeneratesStringId, HasCamelTimestamps, HasFactory;
    protected $table = 'Artwork';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'description', 'status', 'category', 'tagsJson',
        'pricePence', 'currency', 'stockOnHand', 'widthPx', 'heightPx',
        'previewUrl', 'collectionId',
    ];

    protected $casts = [
        'pricePence' => 'integer',
        'stockOnHand' => 'integer',
        'widthPx' => 'integer',
        'heightPx' => 'integer',
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
