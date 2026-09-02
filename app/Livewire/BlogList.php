<?php

namespace App\Livewire;

use App\Models\BlogPost;
use Livewire\Component;

class BlogList extends Component
{
    public function render()
    {
        $posts = BlogPost::where('status', 'PUBLISHED')
            ->where('publishedAt', '<=', now())
            ->with('author')
            ->orderBy('publishedAt', 'desc')
            ->limit(6)
            ->get();

        return view('livewire.blog-list', [
            'posts' => $posts,
        ]);
    }
}
