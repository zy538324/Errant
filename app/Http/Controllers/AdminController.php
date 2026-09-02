<?php

namespace App\Http\Controllers;

use App\Models\Artwork;
use App\Models\Order;
use App\Models\EmailSubscriber;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function dashboard(): View
    {
        $totalArtworks = Artwork::where('status', 'PUBLISHED')->count();
        $totalOrders = Order::count();
        $emailSubscribers = EmailSubscriber::where('status', 'SUBSCRIBED')->count();

        return view('admin.dashboard', [
            'totalArtworks' => $totalArtworks,
            'totalOrders' => $totalOrders,
            'emailSubscribers' => $emailSubscribers,
        ]);
    }
}
