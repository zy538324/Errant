<?php

namespace App\Http\Controllers;

use App\Models\Collection;

class CollectionController extends Controller
{
    public function show(string $slug)
    {
        $collection = Collection::where('slug', $slug)
            ->with(['artworks' => fn ($q) => $q->where('status', 'PUBLISHED')->orderByDesc('createdAt')])
            ->firstOrFail();

        return view('collections.show', ['collection' => $collection]);
    }
}
