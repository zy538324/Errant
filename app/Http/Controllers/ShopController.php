<?php

namespace App\Http\Controllers;

use App\Models\Artwork;
use App\Models\Collection;
use Illuminate\View\View;

class ShopController extends Controller
{
    public function index(): View
    {
        $artworks = Artwork::where('status', 'PUBLISHED')
            ->with('collection', 'assets')
            ->orderBy('createdAt', 'desc')
            ->paginate(12);
        
        $collections = Collection::with('artworks')
            ->orderBy('sortOrder', 'asc')
            ->get();

        return view('shop.index', [
            'artworks' => $artworks,
            'collections' => $collections,
        ]);
    }
}
