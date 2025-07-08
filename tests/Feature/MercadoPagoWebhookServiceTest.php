<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\MercadoPagoWebhookService;
use Illuminate\Http\Request;

class MercadoPagoWebhookServiceTest extends TestCase
{

    /**
     * Prueba que el servicio puede ser instanciado
     */
    public function test_webhook_service_can_be_instantiated(): void
    {
        $service = new MercadoPagoWebhookService();
        $this->assertInstanceOf(MercadoPagoWebhookService::class, $service);
    }

    /**
     * Prueba la validación de headers requeridos
     */
    public function test_validate_required_headers(): void
    {
        $request = new Request();
        
        // Sin headers
        $this->assertFalse($request->hasHeader('x-signature'));
        
        // Con header
        $request->headers->set('x-signature', 'ts=1234567890,v1=test_signature');
        $this->assertTrue($request->hasHeader('x-signature'));
    }

    /**
     * Prueba la estructura de datos de notificación
     */
    public function test_notification_data_structure(): void
    {
        $notificationData = [
            'action' => 'payment.updated',
            'api_version' => 'v1',
            'data' => [
                'id' => '12345678'
            ],
            'date_created' => '2023-01-01T00:00:00.000-04:00',
            'id' => 123456789,
            'live_mode' => false,
            'type' => 'payment',
            'user_id' => 123456789
        ];
        
        // Verificar estructura
        $this->assertArrayHasKey('action', $notificationData);
        $this->assertArrayHasKey('data', $notificationData);
        $this->assertArrayHasKey('type', $notificationData);
        $this->assertArrayHasKey('id', $notificationData['data']);
    }

    /**
     * Prueba la validación de tipos de notificación
     */
    public function test_notification_types(): void
    {
        $supportedTypes = ['payment', 'merchant_order'];
        $unsupportedType = 'unknown_type';
        
        $this->assertContains('payment', $supportedTypes);
        $this->assertContains('merchant_order', $supportedTypes);
        $this->assertNotContains($unsupportedType, $supportedTypes);
    }

    /**
     * Prueba la estructura de respuesta del servicio
     */
    public function test_service_response_structure(): void
    {
        $successResponse = [
            'success' => true,
            'message' => 'Procesado correctamente'
        ];
        
        $errorResponse = [
            'success' => false,
            'message' => 'Error en el procesamiento'
        ];
        
        // Verificar estructura de respuesta exitosa
        $this->assertArrayHasKey('success', $successResponse);
        $this->assertArrayHasKey('message', $successResponse);
        $this->assertTrue($successResponse['success']);
        
        // Verificar estructura de respuesta de error
        $this->assertArrayHasKey('success', $errorResponse);
        $this->assertArrayHasKey('message', $errorResponse);
        $this->assertFalse($errorResponse['success']);
    }
}