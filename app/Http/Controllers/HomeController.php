<?php

namespace App\Http\Controllers;

use App\Models\Artwork;

class HomeController extends Controller
{
    public function index()
    {
        $recentWorks = Artwork::where('status', 'PUBLISHED')
            ->with('collection')
            ->orderByDesc('createdAt')
            ->limit(10)
            ->get();

        return view('home', ['recentWorks' => $recentWorks]);
    }
}
