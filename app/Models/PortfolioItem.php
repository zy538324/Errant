<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class PortfolioItem extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'PortfolioItem';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'description', 'category', 'collectionName',
        'collectionSlug', 'groupsJson', 'previewUrl', 'imageAlt', 'sortOrder', 'status',
    ];
}
