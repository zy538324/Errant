<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\View\View;

class BlogController extends Controller
{
    public function index(): View
    {
        $posts = BlogPost::where('status', 'PUBLISHED')
            ->where('publishedAt', '<=', now())
            ->with('author')
            ->orderBy('publishedAt', 'desc')
            ->paginate(10);

        return view('blog.index', [
            'posts' => $posts,
        ]);
    }

    public function show(string $slug): View
    {
        $post = BlogPost::where('slug', $slug)
            ->where('status', 'PUBLISHED')
            ->with('author')
            ->firstOrFail();

        return view('blog.show', [
            'post' => $post,
        ]);
    }
}
