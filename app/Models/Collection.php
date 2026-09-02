<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class Collection extends Model
{
    use GeneratesStringId, HasCamelTimestamps, HasFactory;
    protected $table = 'Collection';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'slug', 'description', 'coverAsset', 'sortOrder',
    ];

    public function artworks()
    {
        return $this->hasMany(Artwork::class, 'collectionId', 'id');
    }
}
