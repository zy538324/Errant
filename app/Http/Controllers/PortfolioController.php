<?php

namespace App\Http\Controllers;

use App\Models\Artwork;
use App\Models\Collection;
use Illuminate\View\View;

class PortfolioController extends Controller
{
    public function index(): View
    {
        $collections = Collection::with('artworks')
            ->orderBy('sortOrder', 'asc')
            ->get();

        $featuredArtworks = Artwork::where('status', 'PUBLISHED')
            ->with('collection', 'assets')
            ->orderBy('createdAt', 'desc')
            ->limit(8)
            ->get();

        return view('portfolio.index', [
            'collections' => $collections,
            'featuredArtworks' => $featuredArtworks,
        ]);
    }
}
