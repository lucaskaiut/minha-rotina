<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// O middleware de autenticação gera um redirect para a rota nomeada "login"
// quando a requisição não envia "Accept: application/json". Como o frontend é
// um app separado, respondemos 401 em JSON em vez de estourar RouteNotFound.
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
