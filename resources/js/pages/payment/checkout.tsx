import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CheckoutButton } from '@/components/mercadopago/checkout-button';
import { PaymentForm } from '@/components/mercadopago/payment-form';
import { useMercadoPago } from '@/hooks/use-mercadopago';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Package } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

/**
 * Interfaz para los props de la página
 */
interface CheckoutPageProps {
    // Datos que pueden venir del servidor
    cart_items?: Array<{
        id: string;
        title: string;
        description?: string;
        quantity: number;
        unit_price: number;
    }>;
    user?: {
        name?: string;
        email?: string;
    };
}

/**
 * Página de checkout con integración de Mercado Pago
 * Demuestra el uso de los componentes y hooks de Mercado Pago
 */
export default function CheckoutPage({ cart_items = [], user }: CheckoutPageProps) {
    const [activeTab, setActiveTab] = useState<'simple' | 'form'>('simple');
    const { error, processPayment, clearError } = useMercadoPago();

    // Datos de ejemplo para demostración
    const exampleItems = cart_items.length > 0 ? cart_items : [
        {
            id: 'item_1',
            title: 'Producto Premium',
            description: 'Descripción del producto premium',
            quantity: 1,
            unit_price: 2500.00
        },
        {
            id: 'item_2',
            title: 'Servicio Adicional',
            description: 'Servicio complementario',
            quantity: 2,
            unit_price: 750.00
        }
    ];

    // Calcular total
    const total = exampleItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inicio', href: '/' },
        { title: 'Carrito', href: '/cart' },
        { title: 'Checkout', href: '/payment/checkout' }
    ];

    /**
     * Maneja el pago con botón simple
     */
    const handleSimplePayment = async () => {
        try {
            await processPayment({
                items: exampleItems,
                payer: user ? {
                    name: user.name?.split(' ')[0],
                    surname: user.name?.split(' ').slice(1).join(' '),
                    email: user.email
                } : undefined,
                external_reference: `order_${Date.now()}`,
                statement_descriptor: 'KOMMERCE',
                onSuccess: (data) => {
                    console.log('Pago iniciado exitosamente:', data);
                },
                onError: (error) => {
                    console.error('Error en el pago:', error);
                }
            });
        } catch (error) {
            console.error('Error al procesar el pago:', error);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Checkout - Mercado Pago" />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                        <ShoppingCart className="h-8 w-8" />
                        Checkout con Mercado Pago
                    </h1>
                    <p className="text-muted-foreground">
                        Completa tu compra de forma segura con Checkout Pro
                    </p>
                </div>

                {/* Resumen del carrito */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Resumen de la compra
                    </h2>
                    
                    <div className="space-y-3">
                        {exampleItems.map((item, index) => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div className="flex-1">
                                    <h3 className="font-medium">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Cantidad: {item.quantity} × ${item.unit_price.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold">
                                        ${(item.unit_price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-green-600">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </Card>

                {/* Selector de método de pago */}
                <div className="flex justify-center space-x-4">
                    <Button
                        variant={activeTab === 'simple' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('simple')}
                    >
                        Pago Rápido
                    </Button>
                    <Button
                        variant={activeTab === 'form' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('form')}
                    >
                        Formulario Completo
                    </Button>
                </div>

                {/* Mostrar error global si existe */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex justify-between items-start">
                            <div className="text-sm text-red-600">
                                <strong>Error:</strong> {error}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearError}
                                className="text-red-600 hover:text-red-700"
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                )}

                {/* Contenido según la pestaña activa */}
                {activeTab === 'simple' ? (
                    <Card className="p-6">
                        <div className="text-center space-y-4">
                            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Pago Rápido
                            </h2>
                            <p className="text-muted-foreground">
                                Procede directamente al checkout de Mercado Pago
                            </p>
                            
                            <div className="max-w-md mx-auto">
                                <CheckoutButton
                                    items={exampleItems}
                                    payer={user ? {
                                        name: user.name?.split(' ')[0],
                                        surname: user.name?.split(' ').slice(1).join(' '),
                                        email: user.email
                                    } : undefined}
                                    external_reference={`order_${Date.now()}`}
                                    statement_descriptor="KOMMERCE"
                                    className="w-full"
                                    onSuccess={(data) => {
                                        console.log('Pago iniciado exitosamente:', data);
                                    }}
                                    onError={(error) => {
                                        console.error('Error en el pago:', error);
                                    }}
                                >
                                    Pagar ${total.toFixed(2)} con Mercado Pago
                                </CheckoutButton>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <PaymentForm
                        initialData={{
                            title: exampleItems[0]?.title || 'Compra en Kommerce',
                            description: `Compra de ${exampleItems.length} item(s)`,
                            quantity: 1,
                            unit_price: total,
                            payer_name: user?.name?.split(' ')[0] || '',
                            payer_surname: user?.name?.split(' ').slice(1).join(' ') || '',
                            payer_email: user?.email || '',
                            external_reference: `order_${Date.now()}`,
                            statement_descriptor: 'KOMMERCE'
                        }}
                        onSuccess={(data) => {
                            console.log('Pago procesado exitosamente:', data);
                        }}
                        onError={(error) => {
                            console.error('Error en el formulario de pago:', error);
                        }}
                    />
                )}

                {/* Información adicional */}
                <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Información sobre el pago</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Pago 100% seguro con Mercado Pago</li>
                        <li>• Acepta tarjetas de crédito, débito y otros medios de pago</li>
                        <li>• Protección al comprador incluida</li>
                        <li>• Confirmación inmediata del pago</li>
                    </ul>
                </Card>
            </div>
        </AppLayout>
    );
}