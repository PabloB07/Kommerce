<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mercado Pago Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for Mercado Pago integration.
    | You can configure your access token, public key, and other settings here.
    |
    */

    'access_token' => env('MERCADOPAGO_ACCESS_TOKEN'),
    'public_key' => env('MERCADOPAGO_PUBLIC_KEY'),
    
    /*
    |--------------------------------------------------------------------------
    | Environment Configuration
    |--------------------------------------------------------------------------
    |
    | Set to 'sandbox' for testing or 'production' for live transactions
    |
    */
    'environment' => env('MERCADOPAGO_ENVIRONMENT', 'sandbox'),
    
    /*
    |--------------------------------------------------------------------------
    | Webhook Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for webhook notifications
    |
    */
    'webhook' => [
        'secret' => env('MERCADOPAGO_WEBHOOK_SECRET'),
        'endpoint' => env('MERCADOPAGO_WEBHOOK_ENDPOINT', '/webhooks/mercadopago'),
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Return URLs
    |--------------------------------------------------------------------------
    |
    | URLs where users will be redirected after payment
    |
    */
    'return_urls' => [
        'success' => env('APP_URL') . '/payment/success',
        'failure' => env('APP_URL') . '/payment/failure',
        'pending' => env('APP_URL') . '/payment/pending',
    ],
];