<?php

namespace App\Http\Controllers;

use App\Services\MercadoPagoService;
use App\Services\MercadoPagoWebhookService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controlador para manejar pagos con Mercado Pago
 * 
 * Maneja:
 * - Creación de preferencias de pago
 * - Procesamiento de webhooks
 * - Páginas de resultado de pago
 */
class PaymentController extends Controller
{
    private MercadoPagoService $mercadoPagoService;
    private MercadoPagoWebhookService $webhookService;
    
    public function __construct(
        MercadoPagoService $mercadoPagoService,
        MercadoPagoWebhookService $webhookService
    ) {
        Log::info('PaymentController constructor called');
        $this->mercadoPagoService = $mercadoPagoService;
        $this->webhookService = $webhookService;
        Log::info('PaymentController constructor completed');
    }
    
    /**
     * Crea una preferencia de pago
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function createPaymentPreference(Request $request): JsonResponse
    {
        Log::info('createPaymentPreference method called', [
            'request_data' => $request->all()
        ]);
        
        try {
            $validator = Validator::make($request->all(), [
                'items' => 'required|array|min:1',
                'items.*.title' => 'required|string|max:255',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0.01',
                'items.*.description' => 'nullable|string|max:500',
                'payer.email' => 'nullable|email',
                'payer.name' => 'nullable|string|max:255',
                'payer.surname' => 'nullable|string|max:255',
                'external_reference' => 'nullable|string|max:255'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Datos de entrada inválidos',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $items = $request->input('items');
            $payer = $request->input('payer', []);
            $externalReference = $request->input('external_reference');
            
            $result = $this->mercadoPagoService->createPaymentPreference(
                $items,
                $payer,
                $externalReference
            );
            
            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }
            
        } catch (\Exception $e) {
            Log::error('Error en createPaymentPreference', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error interno del servidor',
                'details' => 'No se pudo crear la preferencia de pago'
            ], 500);
        }
    }
    
    /**
     * Maneja los webhooks de Mercado Pago
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            // Validar firma del webhook
            if (!$this->webhookService->validateWebhookSignature($request)) {
                Log::warning('Webhook con firma inválida rechazado', [
                    'ip' => $request->ip(),
                    'headers' => $request->headers->all()
                ]);
                
                return response()->json([
                    'error' => 'Firma inválida'
                ], 401);
            }
            
            // Procesar notificación
            $result = $this->webhookService->processWebhookNotification($request);
            
            if ($result['success']) {
                return response()->json(['status' => 'ok'], 200);
            } else {
                return response()->json($result, 400);
            }
            
        } catch (\Exception $e) {
            Log::error('Error procesando webhook', [
                'message' => $e->getMessage(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error procesando webhook'
            ], 500);
        }
    }
    
    /**
     * Página de éxito del pago
     * 
     * @param Request $request
     * @return Response
     */
    public function paymentSuccess(Request $request): Response
    {
        $paymentData = [
            'collection_id' => $request->query('collection_id'),
            'collection_status' => $request->query('collection_status'),
            'payment_id' => $request->query('payment_id'),
            'status' => $request->query('status'),
            'external_reference' => $request->query('external_reference'),
            'payment_type' => $request->query('payment_type'),
            'merchant_order_id' => $request->query('merchant_order_id'),
            'preference_id' => $request->query('preference_id'),
            'site_id' => $request->query('site_id'),
            'processing_mode' => $request->query('processing_mode'),
            'merchant_account_id' => $request->query('merchant_account_id')
        ];
        
        Log::info('Usuario redirigido a página de éxito', $paymentData);
        
        return Inertia::render('payment/success', [
            'paymentData' => $paymentData
        ]);
    }
    
    /**
     * Página de fallo del pago
     * 
     * @param Request $request
     * @return Response
     */
    public function paymentFailure(Request $request): Response
    {
        $paymentData = [
            'collection_id' => $request->query('collection_id'),
            'collection_status' => $request->query('collection_status'),
            'payment_id' => $request->query('payment_id'),
            'status' => $request->query('status'),
            'external_reference' => $request->query('external_reference'),
            'payment_type' => $request->query('payment_type'),
            'merchant_order_id' => $request->query('merchant_order_id'),
            'preference_id' => $request->query('preference_id'),
            'site_id' => $request->query('site_id'),
            'processing_mode' => $request->query('processing_mode'),
            'merchant_account_id' => $request->query('merchant_account_id')
        ];
        
        Log::info('Usuario redirigido a página de fallo', $paymentData);
        
        return Inertia::render('payment/failure', [
            'paymentData' => $paymentData
        ]);
    }
    
    /**
     * Página de pago pendiente
     * 
     * @param Request $request
     * @return Response
     */
    public function paymentPending(Request $request): Response
    {
        $paymentData = [
            'collection_id' => $request->query('collection_id'),
            'collection_status' => $request->query('collection_status'),
            'payment_id' => $request->query('payment_id'),
            'status' => $request->query('status'),
            'external_reference' => $request->query('external_reference'),
            'payment_type' => $request->query('payment_type'),
            'merchant_order_id' => $request->query('merchant_order_id'),
            'preference_id' => $request->query('preference_id'),
            'site_id' => $request->query('site_id'),
            'processing_mode' => $request->query('processing_mode'),
            'merchant_account_id' => $request->query('merchant_account_id')
        ];
        
        Log::info('Usuario redirigido a página de pendiente', $paymentData);
        
        return Inertia::render('payment/pending', [
            'paymentData' => $paymentData
        ]);
    }
    
    /**
     * Obtiene la clave pública para el frontend
     * 
     * @return JsonResponse
     */
    public function getPublicKey(): JsonResponse
    {
        try {
            $publicKey = $this->mercadoPagoService->getPublicKey();
            
            return response()->json([
                'success' => true,
                'public_key' => $publicKey
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error obteniendo clave pública', [
                'message' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'No se pudo obtener la clave pública'
            ], 500);
        }
    }
}