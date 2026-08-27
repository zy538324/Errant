<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArtworkAsset extends Model
{
    protected $table = 'ArtworkAsset';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'artworkId', 'kind', 'storageKey', 'mimeType', 'bytes', 'checksum', 'createdAt',
    ];

    public function artwork()
    {
        return $this->belongsTo(Artwork::class, 'artworkId', 'id');
    }
}
