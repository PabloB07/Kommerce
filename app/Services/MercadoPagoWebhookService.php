<?php

namespace App\Services;

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\MerchantOrder\MerchantOrderClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Illuminate\Http\Request;

/**
 * Servicio para manejar webhooks de Mercado Pago
 * 
 * Este servicio maneja:
 * - Validación de firmas de webhooks
 * - Procesamiento de notificaciones de pago
 * - Actualización de estados de pedidos
 */
class MercadoPagoWebhookService
{
    private PaymentClient $paymentClient;
    private MerchantOrderClient $merchantOrderClient;
    
    /**
     * Constructor - Inicializa la configuración del SDK solo si no estamos en testing
     */
    public function __construct()
    {
        if (!app()->environment('testing')) {
            $this->initializeMercadoPago();
            $this->paymentClient = new PaymentClient();
            $this->merchantOrderClient = new MerchantOrderClient();
        }
    }
    
    /**
     * Inicializa la configuración de Mercado Pago
     * 
     * @throws \Exception Si no se encuentran las credenciales
     */
    private function initializeMercadoPago(): void
    {
        $accessToken = Config::get('mercadopago.access_token');
        
        if (!$accessToken) {
            throw new \Exception('Mercado Pago access token no configurado');
        }
        
        MercadoPagoConfig::setAccessToken($accessToken);
    }
    
    /**
     * Valida la firma del webhook según la documentación de Mercado Pago
     * 
     * @param Request $request
     * @return bool
     */
    public function validateWebhookSignature(Request $request): bool
    {
        $xSignature = $request->header('x-signature');
        $xRequestId = $request->header('x-request-id');
        $dataId = $request->input('data.id');
        $secret = Config::get('mercadopago.webhook.secret');
        
        if (!$xSignature || !$secret) {
            Log::warning('Webhook sin firma o secreto no configurado');
            return false;
        }
        
        // Extraer ts y v1 de la firma
        $signatureParts = $this->parseSignature($xSignature);
        
        if (!$signatureParts) {
            Log::warning('Formato de firma inválido', ['signature' => $xSignature]);
            return false;
        }
        
        // Crear el string para validar según la documentación de MP
        $manifest = "id:{$dataId};request-id:{$xRequestId};ts:{$signatureParts['ts']};";
        
        // Calcular HMAC SHA256
        $expectedSignature = hash_hmac('sha256', $manifest, $secret);
        
        $isValid = hash_equals($expectedSignature, $signatureParts['v1']);
        
        if (!$isValid) {
            Log::warning('Firma de webhook inválida', [
                'expected' => $expectedSignature,
                'received' => $signatureParts['v1'],
                'manifest' => $manifest
            ]);
        }
        
        return $isValid;
    }
    
    /**
     * Parsea la firma del header x-signature
     * 
     * @param string $signature
     * @return array|null
     */
    private function parseSignature(string $signature): ?array
    {
        $parts = explode(',', $signature);
        $result = [];
        
        foreach ($parts as $part) {
            $keyValue = explode('=', $part, 2);
            if (count($keyValue) === 2) {
                $result[trim($keyValue[0])] = trim($keyValue[1]);
            }
        }
        
        return isset($result['ts'], $result['v1']) ? $result : null;
    }
    
    /**
     * Procesa la notificación del webhook
     * 
     * @param Request $request
     * @return array
     */
    public function processWebhookNotification(Request $request): array
    {
        try {
            $topic = $request->input('topic');
            $dataId = $request->input('data.id');
            
            Log::info('Procesando webhook de Mercado Pago', [
                'topic' => $topic,
                'data_id' => $dataId
            ]);
            
            switch ($topic) {
                case 'payment':
                    return $this->processPaymentNotification($dataId);
                    
                case 'merchant_order':
                    return $this->processMerchantOrderNotification($dataId);
                    
                default:
                    Log::info('Tipo de notificación no manejada', ['topic' => $topic]);
                    return ['success' => true, 'message' => 'Notificación no procesada'];
            }
            
        } catch (\Exception $e) {
            Log::error('Error procesando webhook', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => 'Error procesando notificación',
                'details' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Procesa notificación de pago
     * 
     * @param string $paymentId
     * @return array
     */
    private function processPaymentNotification(string $paymentId): array
    {
        try {
            $payment = $this->paymentClient->get($paymentId);
            
            Log::info('Información de pago recibida', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'external_reference' => $payment->external_reference,
                'transaction_amount' => $payment->transaction_amount
            ]);
            
            // Aquí puedes agregar lógica para actualizar el estado del pedido
            // Por ejemplo, actualizar una tabla de pedidos en la base de datos
            $this->updateOrderStatus($payment);
            
            return [
                'success' => true,
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'external_reference' => $payment->external_reference
            ];
            
        } catch (\Exception $e) {
            Log::error('Error obteniendo información de pago', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Procesa notificación de merchant order
     * 
     * @param string $merchantOrderId
     * @return array
     */
    private function processMerchantOrderNotification(string $merchantOrderId): array
    {
        try {
            $merchantOrder = $this->merchantOrderClient->get($merchantOrderId);
            
            Log::info('Información de merchant order recibida', [
                'merchant_order_id' => $merchantOrder->id,
                'status' => $merchantOrder->status,
                'external_reference' => $merchantOrder->external_reference
            ]);
            
            return [
                'success' => true,
                'merchant_order_id' => $merchantOrder->id,
                'status' => $merchantOrder->status,
                'external_reference' => $merchantOrder->external_reference
            ];
            
        } catch (\Exception $e) {
            Log::error('Error obteniendo información de merchant order', [
                'merchant_order_id' => $merchantOrderId,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Actualiza el estado del pedido basado en la información del pago
     * 
     * @param object $payment
     * @return void
     */
    private function updateOrderStatus($payment): void
    {
        // Implementar lógica de actualización de pedidos
        // Esto dependerá de tu modelo de datos específico
        
        Log::info('Actualizando estado del pedido', [
            'external_reference' => $payment->external_reference,
            'payment_status' => $payment->status,
            'payment_id' => $payment->id
        ]);
        
        // Ejemplo de lógica que podrías implementar:
        /*
        if ($payment->external_reference) {
            $order = Order::where('reference', $payment->external_reference)->first();
            
            if ($order) {
                switch ($payment->status) {
                    case 'approved':
                        $order->status = 'paid';
                        break;
                    case 'rejected':
                        $order->status = 'failed';
                        break;
                    case 'pending':
                        $order->status = 'pending';
                        break;
                }
                
                $order->payment_id = $payment->id;
                $order->save();
            }
        }
        */
    }
}