<?php

namespace App\Http\Controllers;

use App\Models\Artwork;

class ArtworkController extends Controller
{
    public function show(string $slug)
    {
        $artwork = Artwork::where('slug', $slug)
            ->where('status', 'PUBLISHED')
            ->with('collection', 'assets')
            ->firstOrFail();

        $related = Artwork::where('status', 'PUBLISHED')
            ->where('id', '!=', $artwork->id)
            ->when($artwork->collectionId, fn ($q) => $q->where('collectionId', $artwork->collectionId))
            ->limit(4)
            ->get();

        return view('work.show', ['artwork' => $artwork, 'related' => $related]);
    }
}
