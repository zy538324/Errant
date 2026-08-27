<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/shop', function () {
    return view('shop.index');
});

Route::get('/portfolio', function () {
    return view('portfolio.index');
});

Route::get('/blog', function () {
    return view('blog.index');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/admin', function () {
        return view('admin.dashboard');
    });
});

Route::post('/stripe/webhook', function () {
    return response()->json(['status' => 'success']);
});
