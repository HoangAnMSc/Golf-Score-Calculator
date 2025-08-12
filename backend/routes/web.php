<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response('OK', 200);
});

Route::get('/hello', function () {
    return response()->json(['message' => 'Hello from Laravel API']);
});