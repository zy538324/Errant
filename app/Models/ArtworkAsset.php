<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;

class ArtworkAsset extends Model
{
    use GeneratesStringId;
    protected $table = 'ArtworkAsset';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'artworkId', 'kind', 'storageKey', 'mimeType', 'bytes', 'checksum', 'createdAt',
    ];

    protected $casts = [
        'createdAt' => 'datetime',
        'bytes' => 'integer',
    ];

    public function artwork()
    {
        return $this->belongsTo(Artwork::class, 'artworkId', 'id');
    }
}
