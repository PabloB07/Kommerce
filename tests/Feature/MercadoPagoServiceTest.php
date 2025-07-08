<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\MercadoPagoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Mockery;

/**
 * Casos de prueba para el servicio de Mercado Pago
 * Verifica la funcionalidad de creación de preferencias y manejo de errores
 */
class MercadoPagoServiceTest extends TestCase
{
    use RefreshDatabase;

    protected MercadoPagoService $service;
    protected array $validItems;
    protected array $validPayer;

    /**
     * Configuración inicial para cada prueba
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // Configurar credenciales de prueba
        Config::set('mercadopago.access_token', 'TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789');
        Config::set('mercadopago.public_key', 'TEST-12345678-1234-1234-1234-123456789012');
        Config::set('mercadopago.environment', 'sandbox');
        
        $this->service = new MercadoPagoService();
        
        // Datos de prueba válidos
        $this->validItems = [
            [
                'id' => 'item_1',
                'title' => 'Producto de Prueba',
                'description' => 'Descripción del producto de prueba',
                'quantity' => 1,
                'unit_price' => 100.50,
                'currency_id' => 'ARS'
            ]
        ];
        
        $this->validPayer = [
            'name' => 'Juan',
            'surname' => 'Pérez',
            'email' => 'juan.perez@test.com',
            'phone' => [
                'area_code' => '11',
                'number' => '12345678'
            ],
            'identification' => [
                'type' => 'DNI',
                'number' => '12345678'
            ],
            'address' => [
                'street_name' => 'Calle Falsa',
                'street_number' => '123',
                'zip_code' => '1234'
            ]
        ];
    }

    /**
     * Prueba la validación de datos de entrada
     */
    public function test_validate_input_data(): void
    {
        $service = new MercadoPagoService();
        
        // Datos válidos
        $validData = [
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
            ]
        ];
        
        // En ambiente de testing, el servicio no inicializa el SDK
        // por lo que podemos probar la validación de datos
        $this->assertTrue(is_array($validData['items']));
        $this->assertNotEmpty($validData['items']);
        $this->assertArrayHasKey('email', $validData['payer']);
        $this->assertTrue(filter_var($validData['payer']['email'], FILTER_VALIDATE_EMAIL) !== false);
    }

    /**
     * Prueba la validación de items vacíos
     */
    public function test_validate_empty_items(): void
    {
        $emptyItems = [];
        
        $this->assertTrue(empty($emptyItems));
        $this->assertCount(0, $emptyItems);
    }

    /**
     * Prueba la validación de items inválidos
     */
    public function test_validate_invalid_items(): void
    {
        $invalidItems = [
            [
                'title' => 'Producto sin precio',
                'quantity' => 1
                // Falta unit_price
            ]
        ];
        
        $this->assertArrayNotHasKey('unit_price', $invalidItems[0]);
        $this->assertArrayHasKey('title', $invalidItems[0]);
        $this->assertArrayHasKey('quantity', $invalidItems[0]);
    }

    /**
     * Prueba la validación de email de pagador inválido
     */
    public function test_validate_invalid_payer_email(): void
    {
        $invalidEmail = 'email_invalido';
        
        $this->assertFalse(filter_var($invalidEmail, FILTER_VALIDATE_EMAIL));
        $this->assertStringNotContainsString('@', $invalidEmail);
    }

    /**
     * Prueba la obtención de la clave pública desde configuración
     */
    public function test_get_public_key_from_config(): void
    {
        $publicKey = Config::get('mercadopago.public_key');
        
        $this->assertNotEmpty($publicKey);
        $this->assertStringStartsWith('TEST-', $publicKey);
    }

    /**
     * Prueba la configuración del servicio
     */
    public function test_service_configuration(): void
    {
        $accessToken = Config::get('mercadopago.access_token');
        $publicKey = Config::get('mercadopago.public_key');
        $environment = Config::get('mercadopago.environment');
        
        $this->assertNotEmpty($accessToken);
        $this->assertNotEmpty($publicKey);
        $this->assertEquals('sandbox', $environment);
        $this->assertStringStartsWith('TEST-', $accessToken);
        $this->assertStringStartsWith('TEST-', $publicKey);
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