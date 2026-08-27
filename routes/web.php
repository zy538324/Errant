<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/stripe/webhook', function () {
    return response()->json(['status' => 'success']);
});
