import { Head } from '@inertiajs/react';
import { XCircle, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface PaymentData {
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
    payment_type?: string;
    merchant_order_id?: string;
    preference_id?: string;
    site_id?: string;
    processing_mode?: string;
    merchant_account_id?: string;
}

interface Props {
    paymentData: PaymentData;
}

/**
 * Página de fallo del pago
 * 
 * Muestra información sobre el pago fallido y opciones
 * para reintentar o contactar soporte.
 */
export default function PaymentFailure({ paymentData }: Props) {
    const getFailureReason = (status?: string) => {
        switch (status) {
            case 'rejected':
                return 'El pago fue rechazado por el procesador';
            case 'cancelled':
                return 'El pago fue cancelado';
            case 'refunded':
                return 'El pago fue reembolsado';
            default:
                return 'Ocurrió un error durante el procesamiento del pago';
        }
    };

    const getRecommendation = (status?: string) => {
        switch (status) {
            case 'rejected':
                return 'Verifica los datos de tu tarjeta o intenta con otro método de pago';
            case 'cancelled':
                return 'Puedes intentar realizar el pago nuevamente';
            default:
                return 'Por favor, intenta nuevamente o contacta a nuestro soporte';
        }
    };

    return (
        <>
            <Head title="Pago Fallido" />
            
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-6">
                            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-red-800 dark:text-red-200">
                                Pago No Procesado
                            </CardTitle>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                                {getFailureReason(paymentData.status)}
                            </p>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {/* Información del error */}
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                                        ¿Qué puedes hacer?
                                    </h3>
                                </div>
                                <p className="text-red-700 dark:text-red-300 text-sm">
                                    {getRecommendation(paymentData.status)}
                                </p>
                            </div>
                            
                            {/* Detalles del intento de pago */}
                            {(paymentData.payment_id || paymentData.external_reference || paymentData.status) && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                        Detalles del Intento
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {paymentData.payment_id && (
                                            <div>
                                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                                    ID de Pago:
                                                </span>
                                                <p className="text-gray-800 dark:text-gray-200 font-mono">
                                                    {paymentData.payment_id}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {paymentData.status && (
                                            <div>
                                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                                    Estado:
                                                </span>
                                                <p className="text-red-600 dark:text-red-400 font-semibold capitalize">
                                                    {paymentData.status}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {paymentData.external_reference && (
                                            <div>
                                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                                    Referencia:
                                                </span>
                                                <p className="text-gray-800 dark:text-gray-200 font-mono">
                                                    {paymentData.external_reference}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {paymentData.payment_type && (
                                            <div>
                                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                                    Método Intentado:
                                                </span>
                                                <p className="text-gray-800 dark:text-gray-200 capitalize">
                                                    {paymentData.payment_type}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Acciones disponibles */}
                            <div className="text-center space-y-4">
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Si el problema persiste, no dudes en contactar a nuestro equipo de soporte.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button 
                                        onClick={() => window.history.back()}
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Intentar Nuevamente
                                    </Button>
                                    
                                    <Link href={route('dashboard')}>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            Ir al Dashboard
                                        </Button>
                                    </Link>
                                    
                                    <Link href={route('home')}>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Volver al Inicio
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Información de contacto */}
                            <div className="border-t pt-4 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    ¿Necesitas ayuda? Contacta a nuestro soporte:
                                </p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                                    soporte@kommerce.com
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}