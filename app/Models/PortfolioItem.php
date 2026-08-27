<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioItem extends Model
{
    protected $table = 'PortfolioItem';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'description', 'category', 'collectionName',
        'collectionSlug', 'groupsJson', 'previewUrl', 'imageAlt', 'sortOrder', 'status',
    ];
}
