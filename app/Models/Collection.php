<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
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
