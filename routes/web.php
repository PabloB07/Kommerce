<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PaymentController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// Rutas de pago
Route::prefix('payment')->name('payment.')->group(function () {
    // Página de checkout
    Route::get('checkout', function () {
        return Inertia::render('payment/checkout');
    })->name('checkout');
    
    // Crear preferencia de pago
    Route::post('create-preference', [PaymentController::class, 'createPaymentPreference'])
        ->name('create-preference');
    
    // Obtener clave pública
    Route::get('public-key', [PaymentController::class, 'getPublicKey'])
        ->name('public-key');
    
    // Páginas de resultado
    Route::get('success', [PaymentController::class, 'paymentSuccess'])
        ->name('success');
    
    Route::get('failure', [PaymentController::class, 'paymentFailure'])
        ->name('failure');
    
    Route::get('pending', [PaymentController::class, 'paymentPending'])
        ->name('pending');
});

// Webhook de Mercado Pago (sin middleware de autenticación)
Route::post('webhooks/mercadopago', [PaymentController::class, 'handleWebhook'])
    ->name('webhooks.mercadopago');

// Ruta temporal para testing sin CSRF
Route::post('test/create-preference', [PaymentController::class, 'createPaymentPreference'])
    ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

// Ruta para verificar configuración de Mercado Pago
Route::get('/test/mp-config', function () {
    return response()->json([
        'access_token_configured' => !empty(env('MERCADOPAGO_ACCESS_TOKEN')),
        'public_key_configured' => !empty(env('MERCADOPAGO_PUBLIC_KEY')),
        'environment' => env('MERCADOPAGO_ENVIRONMENT'),
        'success_url' => env('MERCADOPAGO_SUCCESS_URL'),
        'failure_url' => env('MERCADOPAGO_FAILURE_URL'),
        'pending_url' => env('MERCADOPAGO_PENDING_URL')
    ]);
});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
