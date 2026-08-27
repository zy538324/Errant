<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $table = 'BlogPost';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'excerpt', 'content', 'status', 'publishedAt', 'authorId',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'authorId', 'id');
    }
}
