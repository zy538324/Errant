<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class SitePage extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'SitePage';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'key', 'title', 'eyebrow', 'intro', 'body', 'imageUrl',
        'seoTitle', 'seoDescription', 'metadataJson', 'status', 'updatedById',
    ];
}
