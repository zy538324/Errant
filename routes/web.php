<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\AdminController;

Route::get('/', [ShopController::class, 'index']);
Route::get('/shop', [ShopController::class, 'index']);

Route::get('/portfolio', [PortfolioController::class, 'index']);

Route::get('/blog', [BlogController::class, 'index']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);

Route::get('/about', function () {
    return view('about');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/admin', [AdminController::class, 'dashboard']);
});

Route::post('/stripe/webhook', function () {
    return response()->json(['status' => 'success']);
});
