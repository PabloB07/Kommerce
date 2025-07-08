import { Head } from '@inertiajs/react';
import { CheckCircle, ArrowLeft, Receipt } from 'lucide-react';
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
 * Página de éxito del pago
 * 
 * Muestra la confirmación de pago exitoso con los detalles
 * de la transacción y opciones para continuar navegando.
 */
export default function PaymentSuccess({ paymentData }: Props) {
    return (
        <>
            <Head title="Pago Exitoso" />
            
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-6">
                            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-green-800 dark:text-green-200">
                                ¡Pago Exitoso!
                            </CardTitle>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                                Tu pago ha sido procesado correctamente
                            </p>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {/* Detalles del pago */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                        Detalles de la Transacción
                                    </h3>
                                </div>
                                
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
                                            <p className="text-green-600 dark:text-green-400 font-semibold capitalize">
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
                                                {paymentData.payment_type}
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
                            
                            {/* Mensaje de confirmación */}
                            <div className="text-center space-y-4">
                                <p className="text-gray-600 dark:text-gray-300">
                                    Recibirás un email de confirmación con los detalles de tu compra.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href={route('dashboard')}>
                                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}