<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\GeneratesStringId;
use App\Models\Concerns\HasCamelTimestamps;

class BlogPost extends Model
{
    use GeneratesStringId, HasCamelTimestamps;
    protected $table = 'BlogPost';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'excerpt', 'content', 'status', 'publishedAt', 'authorId',
    ];

    protected $casts = [
        'publishedAt' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'authorId', 'id');
    }
}
