<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitePage extends Model
{
    protected $table = 'SitePage';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'key', 'title', 'eyebrow', 'intro', 'body', 'imageUrl',
        'seoTitle', 'seoDescription', 'metadataJson', 'status', 'updatedById',
    ];
}
