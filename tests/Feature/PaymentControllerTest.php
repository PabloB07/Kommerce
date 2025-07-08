<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\MercadoPagoService;
use App\Services\MercadoPagoWebhookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Mockery;

/**
 * Casos de prueba para el controlador de pagos
 * Verifica las rutas, endpoints y manejo de webhooks
 */
class PaymentControllerTest extends TestCase
{

    protected function setUp(): void
    {
        parent::setUp();
        
        // Configurar credenciales de prueba
        Config::set('mercadopago.access_token', 'TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789');
        Config::set('mercadopago.public_key', 'TEST-12345678-1234-1234-1234-123456789012');
        Config::set('mercadopago.environment', 'sandbox');
        Config::set('mercadopago.webhook.secret', 'test_webhook_secret');
    }

    /**
     * Prueba que la ruta de creación de preferencia existe
     */
    public function test_create_payment_preference_route_exists(): void
    {
        $requestData = [
            'items' => [
                [
                    'id' => 'item_1',
                    'title' => 'Producto de Prueba',
                    'description' => 'Descripción del producto',
                    'quantity' => 1,
                    'unit_price' => 100.50,
                    'currency_id' => 'ARS'
                ]
            ],
            'payer' => [
                'name' => 'Juan',
                'surname' => 'Pérez',
                'email' => 'juan.perez@test.com'
            ],
            'external_reference' => 'test_order_123',
            'statement_descriptor' => 'TEST_STORE'
        ];
        
        // En ambiente de testing, el servicio no se inicializa completamente
        // pero podemos verificar que la ruta existe y maneja la request
        $response = $this->postJson('/payment/create-preference', $requestData);
        
        // La ruta debe existir (no 404)
        $this->assertNotEquals(404, $response->getStatusCode());
    }

    /**
     * Prueba que la ruta de clave pública existe
     */
    public function test_get_public_key_route_exists(): void
    {
        $response = $this->getJson('/payment/public-key');
        
        // La ruta debe existir (no 404)
        $this->assertNotEquals(404, $response->getStatusCode());
    }

    /**
     * Prueba que la ruta de webhook existe
     */
    public function test_webhook_route_exists(): void
    {
        $webhookData = [
            'action' => 'payment.updated',
            'data' => ['id' => '12345678'],
            'type' => 'payment'
        ];
        
        $response = $this->postJson('/webhooks/mercadopago', $webhookData, [
            'x-signature' => 'ts=1234567890,v1=test_signature',
            'x-request-id' => 'test_request_id'
        ]);
        
        // La ruta debe existir (no 404)
        $this->assertNotEquals(404, $response->getStatusCode());
    }

    /**
     * Prueba la página de éxito del pago
     */
    public function test_payment_success_page(): void
    {
        $response = $this->get('/payment/success?collection_id=123456&collection_status=approved&payment_id=789012');
        
        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('payment/success')
                    ->has('payment_data')
                    ->where('payment_data.collection_id', '123456')
                    ->where('payment_data.collection_status', 'approved')
                    ->where('payment_data.payment_id', '789012')
            );
    }

    /**
     * Prueba la página de fallo del pago
     */
    public function test_payment_failure_page(): void
    {
        $response = $this->get('/payment/failure?collection_id=123456&collection_status=rejected&payment_id=789012');
        
        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('payment/failure')
                    ->has('payment_data')
                    ->where('payment_data.collection_id', '123456')
                    ->where('payment_data.collection_status', 'rejected')
                    ->where('payment_data.payment_id', '789012')
            );
    }

    /**
     * Prueba la página de pago pendiente
     */
    public function test_payment_pending_page(): void
    {
        $response = $this->get('/payment/pending?collection_id=123456&collection_status=pending&payment_id=789012');
        
        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('payment/pending')
                    ->has('payment_data')
                    ->where('payment_data.collection_id', '123456')
                    ->where('payment_data.collection_status', 'pending')
                    ->where('payment_data.payment_id', '789012')
            );
    }

    /**
     * Prueba la página de checkout
     */
    public function test_checkout_page(): void
    {
        $response = $this->get('/payment/checkout');
        
        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('payment/checkout')
            );
    }

    /**
     * Prueba el manejo de excepciones en el controlador
     */
    public function test_create_payment_preference_exception(): void
    {
        // Mock del servicio que lanza excepción
        $mockService = Mockery::mock(MercadoPagoService::class);
        $mockService->shouldReceive('createPaymentPreference')
            ->once()
            ->andThrow(new \Exception('Error inesperado'));
        
        $this->app->instance(MercadoPagoService::class, $mockService);
        
        $requestData = [
            'items' => [
                [
                    'id' => 'item_1',
                    'title' => 'Producto de Prueba',
                    'quantity' => 1,
                    'unit_price' => 100.50
                ]
            ]
        ];
        
        $response = $this->postJson('/payment/create-preference', $requestData);
        
        $response->assertStatus(500)
            ->assertJson([
                'success' => false
            ])
            ->assertJsonStructure([
                'success',
                'message'
            ]);
    }

    /**
     * Limpieza después de cada prueba
     */
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}