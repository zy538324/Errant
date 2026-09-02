<?php

namespace App\Http\Controllers;

use App\Models\CustomerReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PageController extends Controller
{
    public function about()
    {
        return view('pages.about');
    }

    public function contact()
    {
        return view('pages.contact');
    }

    public function privacy()
    {
        return view('pages.privacy');
    }

    public function terms()
    {
        return view('pages.terms');
    }

    public function refundsReturns()
    {
        return view('pages.refunds-returns');
    }

    public function digitalDownloadLicence()
    {
        return view('pages.digital-download-licence');
    }

    public function reviews()
    {
        $reviews = CustomerReview::where('status', 'APPROVED')
            ->orderByDesc('approvedAt')
            ->paginate(12);

        return view('pages.reviews', ['reviews' => $reviews]);
    }
}
