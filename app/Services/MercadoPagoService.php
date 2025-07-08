<?php

namespace App\Services;

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Resources\Preference;
use MercadoPago\Exceptions\MPApiException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

/**
 * Servicio para manejar la integración con Mercado Pago
 * 
 * Este servicio proporciona métodos para:
 * - Configurar el SDK de Mercado Pago
 * - Crear preferencias de pago
 * - Manejar respuestas de la API
 */
class MercadoPagoService
{
    private PreferenceClient $preferenceClient;
    
    public function __construct()
    {
        if (!app()->environment('testing')) {
            $this->initializeMercadoPago();
            $this->preferenceClient = new PreferenceClient();
        }
    }
    
    /**
     * Inicializa la configuración de Mercado Pago
     * 
     * @throws \Exception Si no se encuentran las credenciales
     */
    private function initializeMercadoPago(): void
    {
        // Intentar obtener el token directamente del .env como solución temporal
        $accessToken = env('MERCADOPAGO_ACCESS_TOKEN');
        
        // Log temporal para debug
        Log::info('Debug MercadoPago config', [
            'access_token_from_env' => $accessToken ? 'PRESENTE' : 'AUSENTE',
            'access_token_length' => $accessToken ? strlen($accessToken) : 0,
            'config_path_exists' => file_exists(config_path('mercadopago.php')),
            'env_file_exists' => file_exists(base_path('.env'))
        ]);
        
        if (!$accessToken) {
            throw new \Exception('Mercado Pago access token no configurado');
        }
        
        MercadoPagoConfig::setAccessToken($accessToken);
        
        // Configurar el entorno basado en la variable de entorno
        $environment = env('MERCADOPAGO_ENVIRONMENT', 'sandbox');
        if ($environment === 'production') {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::SERVER);
        } else {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::SERVER);
        }
    }
    
    /**
     * Crea una preferencia de pago en Mercado Pago
     * 
     * @param array $items Array de items del carrito
     * @param array $payer Información del pagador
     * @param string|null $externalReference Referencia externa del pedido
     * @return array Respuesta con la preferencia creada o error
     */
    public function createPaymentPreference(array $items, array $payer = [], ?string $externalReference = null): array
    {
        try {
            $preference = $this->buildPreferenceData($items, $payer, $externalReference);
            
            // Log de los datos que se envían a Mercado Pago
            Log::info('Datos de preferencia enviados a Mercado Pago', [
                'preference_data' => $preference,
                'items_count' => count($items),
                'has_payer' => !empty($payer),
                'external_reference' => $externalReference
            ]);
            
            $response = $this->preferenceClient->create($preference);
            
            Log::info('Preferencia de Mercado Pago creada', [
                'preference_id' => $response->id,
                'external_reference' => $externalReference
            ]);
            
            return [
                'success' => true,
                'preference_id' => $response->id,
                'init_point' => $response->init_point,
                'sandbox_init_point' => $response->sandbox_init_point,
                'public_key' => env('MERCADOPAGO_PUBLIC_KEY')
            ];
            
        } catch (MPApiException $e) {
            Log::error('Error de API de Mercado Pago', [
                'message' => $e->getMessage(),
                'status_code' => $e->getStatusCode(),
                'api_response' => $e->getApiResponse()
            ]);
            
            return [
                'success' => false,
                'error' => 'Error al crear la preferencia de pago',
                'details' => $e->getMessage()
            ];
            
        } catch (\Exception $e) {
            Log::error('Error general en MercadoPagoService', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => 'Error interno del servidor',
                'details' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Construye los datos de la preferencia de pago
     * 
     * @param array $items
     * @param array $payer
     * @param string|null $externalReference
     * @return array
     */
    private function buildPreferenceData(array $items, array $payer, ?string $externalReference): array
    {
        $preferenceData = [
            'items' => $this->formatItems($items),
            'back_urls' => [
                'success' => env('MERCADOPAGO_SUCCESS_URL'),
                'failure' => env('MERCADOPAGO_FAILURE_URL'),
                'pending' => env('MERCADOPAGO_PENDING_URL')
            ],
            'auto_return' => 'approved',
            // Explícitamente establecer notification_url como null para evitar URLs automáticas
            'notification_url' => null,
            'statement_descriptor' => 'Kommerce Store'
        ];
        
        if ($externalReference) {
            $preferenceData['external_reference'] = $externalReference;
        }
        
        if (!empty($payer)) {
            $preferenceData['payer'] = $this->formatPayer($payer);
        }
        
        return $preferenceData;
    }
    
    /**
     * Formatea los items para Mercado Pago
     * 
     * @param array $items
     * @return array
     */
    private function formatItems(array $items): array
    {
        return array_map(function ($item) {
            return [
                'id' => $item['id'] ?? uniqid(),
                'title' => $item['title'],
                'description' => $item['description'] ?? '',
                'quantity' => (int) $item['quantity'],
                'unit_price' => (float) $item['unit_price'],
                'currency_id' => $item['currency_id'] ?? 'ARS'
            ];
        }, $items);
    }
    
    /**
     * Formatea la información del pagador
     * 
     * @param array $payer
     * @return array
     */
    private function formatPayer(array $payer): array
    {
        $formattedPayer = [];
        
        if (isset($payer['name'])) {
            $formattedPayer['name'] = $payer['name'];
        }
        
        if (isset($payer['surname'])) {
            $formattedPayer['surname'] = $payer['surname'];
        }
        
        if (isset($payer['email'])) {
            $formattedPayer['email'] = $payer['email'];
        }
        
        if (isset($payer['phone'])) {
            $formattedPayer['phone'] = [
                'area_code' => $payer['phone']['area_code'] ?? '',
                'number' => $payer['phone']['number'] ?? ''
            ];
        }
        
        if (isset($payer['identification'])) {
            $formattedPayer['identification'] = [
                'type' => $payer['identification']['type'],
                'number' => $payer['identification']['number']
            ];
        }
        
        return $formattedPayer;
    }
    
    /**
     * Obtiene la clave pública para el frontend
     * 
     * @return string
     */
    public function getPublicKey(): string
    {
        return env('MERCADOPAGO_PUBLIC_KEY', '');
    }
}