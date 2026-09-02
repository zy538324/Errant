<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\ArtworkController as AdminArtworkController;
use App\Http\Controllers\Admin\CollectionController as AdminCollectionController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ArtworkController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

// -- Public site -------------------------------------------------------

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/shop', [ShopController::class, 'index'])->name('shop');
Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio');
Route::get('/work/{slug}', [ArtworkController::class, 'show'])->name('work.show');
Route::get('/collections/{slug}', [CollectionController::class, 'show'])->name('collections.show');

Route::get('/blog', [BlogController::class, 'index'])->name('blog');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::get('/reviews', [PageController::class, 'reviews'])->name('reviews');
Route::get('/privacy', [PageController::class, 'privacy'])->name('privacy');
Route::get('/terms', [PageController::class, 'terms'])->name('terms');
Route::get('/refunds-returns', [PageController::class, 'refundsReturns'])->name('refunds-returns');
Route::get('/digital-download-licence', [PageController::class, 'digitalDownloadLicence'])->name('digital-download-licence');

// -- Cart & checkout -----------------------------------------------------

Route::get('/cart', fn () => view('cart'))->name('cart');
Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout.show');
Route::post('/checkout', [CheckoutController::class, 'createSession'])->name('checkout.session');
Route::get('/checkout/complete', [CheckoutController::class, 'complete'])->name('checkout.complete');

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])->name('stripe.webhook');

// -- Customer account (magic-link auth) -----------------------------------

Route::prefix('account')->name('account.')->group(function () {
    Route::get('/login', [AccountController::class, 'showLogin'])->name('login');
    Route::post('/login/request', [AccountController::class, 'requestCode'])->name('login.request');
    Route::post('/login/verify', [AccountController::class, 'verifyCode'])->name('login.verify');
    Route::post('/logout', [AccountController::class, 'logout'])->name('logout');

    Route::middleware('auth')->group(function () {
        Route::get('/', [AccountController::class, 'dashboard'])->name('dashboard');
        Route::get('/orders', [AccountController::class, 'orders'])->name('orders');
        Route::get('/downloads', [AccountController::class, 'downloads'])->name('downloads');
        Route::get('/privacy', [AccountController::class, 'privacy'])->name('privacy');
    });
});

Route::middleware('auth')->post('/downloads/{entitlement}', [DownloadController::class, 'issue'])->name('downloads.issue');

// -- Admin -----------------------------------------------------------------

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::middleware('admin')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');

        Route::resource('artworks', AdminArtworkController::class)->except('show');
        Route::resource('collections', AdminCollectionController::class)->except('show');
    });
});
