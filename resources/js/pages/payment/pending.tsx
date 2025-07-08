import { Head } from '@inertiajs/react';
import { Clock, ArrowLeft, RefreshCw, Info } from 'lucide-react';
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
 * Página de pago pendiente
 * 
 * Muestra información sobre el pago pendiente y próximos pasos
 * que debe seguir el usuario.
 */
export default function PaymentPending({ paymentData }: Props) {
    const getPendingReason = (paymentType?: string) => {
        switch (paymentType) {
            case 'ticket':
            case 'atm':
                return 'Tu pago está pendiente de confirmación. Debes completar el pago en el punto de pago seleccionado.';
            case 'bank_transfer':
                return 'Tu pago está pendiente de confirmación. La transferencia bancaria puede tardar hasta 3 días hábiles.';
            default:
                return 'Tu pago está siendo procesado. Te notificaremos cuando se complete.';
        }
    };

    const getNextSteps = (paymentType?: string) => {
        switch (paymentType) {
            case 'ticket':
            case 'atm':
                return [
                    'Dirígete al punto de pago seleccionado',
                    'Presenta el código de pago o comprobante',
                    'Realiza el pago en efectivo',
                    'Guarda el comprobante de pago'
                ];
            case 'bank_transfer':
                return [
                    'Revisa tu email para los datos de transferencia',
                    'Realiza la transferencia desde tu banco',
                    'El proceso puede tardar hasta 3 días hábiles',
                    'Te notificaremos cuando se acredite el pago'
                ];
            default:
                return [
                    'Mantén este comprobante como referencia',
                    'Te enviaremos un email con actualizaciones',
                    'El procesamiento puede tardar unos minutos',
                    'Puedes verificar el estado en tu dashboard'
                ];
        }
    };

    const getEstimatedTime = (paymentType?: string) => {
        switch (paymentType) {
            case 'ticket':
            case 'atm':
                return 'Hasta 2 horas después del pago';
            case 'bank_transfer':
                return '1 a 3 días hábiles';
            default:
                return 'Unos minutos';
        }
    };

    return (
        <>
            <Head title="Pago Pendiente" />
            
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-6">
                            <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                                Pago Pendiente
                            </CardTitle>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                                {getPendingReason(paymentData.payment_type)}
                            </p>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {/* Información importante */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                                        Próximos Pasos
                                    </h3>
                                </div>
                                <ul className="space-y-2 text-yellow-700 dark:text-yellow-300 text-sm">
                                    {getNextSteps(paymentData.payment_type).map((step, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full text-xs flex items-center justify-center font-semibold mt-0.5">
                                                {index + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Tiempo estimado */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                    Tiempo Estimado de Confirmación
                                </h3>
                                <p className="text-blue-700 dark:text-blue-300 text-sm">
                                    <strong>{getEstimatedTime(paymentData.payment_type)}</strong>
                                </p>
                            </div>
                            
                            {/* Detalles del pago */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                    Detalles del Pago
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
                                            <p className="text-yellow-600 dark:text-yellow-400 font-semibold capitalize">
                                                {paymentData.status}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {paymentData.payment_type && (
                                        <div>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">
                                                Método de Pago:
                                            </span>
                                            <p className="text-gray-800 dark:text-gray-200 capitalize">
                                                {paymentData.payment_type.replace('_', ' ')}
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
                                    
                                    {paymentData.merchant_order_id && (
                                        <div>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">
                                                Orden:
                                            </span>
                                            <p className="text-gray-800 dark:text-gray-200 font-mono">
                                                {paymentData.merchant_order_id}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {paymentData.collection_id && (
                                        <div>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">
                                                ID de Colección:
                                            </span>
                                            <p className="text-gray-800 dark:text-gray-200 font-mono">
                                                {paymentData.collection_id}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Acciones disponibles */}
                            <div className="text-center space-y-4">
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Recibirás una notificación por email cuando tu pago sea confirmado.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href={route('dashboard')}>
                                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Verificar Estado
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
                                    ¿Tienes dudas sobre tu pago?
                                </p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                                    Contacta a soporte: soporte@kommerce.com
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}