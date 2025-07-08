import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { LoaderCircle, CreditCard, User, Mail, Phone, MapPin } from 'lucide-react';
import InputError from '@/components/input-error';

/**
 * Interfaz para los datos del formulario de pago
 */
interface PaymentFormData {
    // Información del producto/servicio
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    
    // Información del pagador
    payer_name: string;
    payer_surname: string;
    payer_email: string;
    payer_phone?: string;
    payer_identification_type?: string;
    payer_identification_number?: string;
    
    // Información de dirección (opcional)
    address_street_name?: string;
    address_street_number?: string;
    address_zip_code?: string;
    
    // Referencia externa
    external_reference?: string;
    statement_descriptor?: string;
}

/**
 * Props del componente PaymentForm
 */
interface PaymentFormProps {
    initialData?: Partial<PaymentFormData>;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    className?: string;
}

/**
 * Componente de formulario de pago integrado con Mercado Pago
 * Captura información del usuario y procesa el pago mediante Checkout Pro
 */
export function PaymentForm({
    initialData = {},
    onSuccess,
    onError,
    className
}: PaymentFormProps) {
    const [processing, setProcessing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { data, setData, post, errors, reset } = useForm<Record<keyof PaymentFormData, string | number>>({
        title: initialData.title || '',
        description: initialData.description || '',
        quantity: initialData.quantity || 1,
        unit_price: initialData.unit_price || 0,
        payer_name: initialData.payer_name || '',
        payer_surname: initialData.payer_surname || '',
        payer_email: initialData.payer_email || '',
        payer_phone: initialData.payer_phone || '',
        payer_identification_type: initialData.payer_identification_type || 'DNI',
        payer_identification_number: initialData.payer_identification_number || '',
        address_street_name: initialData.address_street_name || '',
        address_street_number: initialData.address_street_number || '',
        address_zip_code: initialData.address_zip_code || '',
        external_reference: initialData.external_reference || '',
        statement_descriptor: initialData.statement_descriptor || '',
    });

    /**
     * Maneja el envío del formulario
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (processing) return;
        
        setProcessing(true);
        setApiError(null);

        try {
            // Validaciones básicas
            if (!data.title || !data.payer_name || !data.payer_email || Number(data.unit_price) <= 0) {
                throw new Error('Por favor complete todos los campos requeridos');
            }

            // Crear la preferencia de pago
            const response = await fetch('/payment/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    items: [{
                        id: `item_${Date.now()}`,
                        title: data.title,
                        description: data.description,
                        quantity: data.quantity,
                        unit_price: data.unit_price,
                        currency_id: 'ARS' // Cambiar según el país
                    }],
                    payer: {
                        name: data.payer_name,
                        surname: data.payer_surname,
                        email: data.payer_email,
                        phone: data.payer_phone ? {
                            number: data.payer_phone
                        } : undefined,
                        identification: data.payer_identification_number ? {
                            type: data.payer_identification_type,
                            number: data.payer_identification_number
                        } : undefined,
                        address: (data.address_street_name || data.address_zip_code) ? {
                            street_name: data.address_street_name,
                            street_number: data.address_street_number,
                            zip_code: data.address_zip_code
                        } : undefined
                    },
                    external_reference: data.external_reference,
                    statement_descriptor: data.statement_descriptor
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar el pago');
            }

            const responseData = await response.json();

            if (!responseData.success || !responseData.init_point) {
                throw new Error(responseData.message || 'No se pudo obtener el enlace de pago');
            }

            // Ejecutar callback de éxito
            if (onSuccess) {
                onSuccess(responseData);
            }

            // Redirigir a Checkout Pro
            window.location.href = responseData.init_point;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setApiError(errorMessage);
            
            if (onError) {
                onError(err);
            }

            console.error('Error en el proceso de pago:', err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Card className={`p-6 ${className || ''}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información del producto/servicio */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Información del Pago
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="title">Título *</Label>
                            <Input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Ej: Producto Premium"
                                required
                            />
                            <InputError message={errors.title} />
                        </div>
                        
                        <div>
                            <Label htmlFor="unit_price">Precio *</Label>
                            <Input
                                id="unit_price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={data.unit_price}
                                onChange={(e) => setData('unit_price', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                required
                            />
                            <InputError message={errors.unit_price} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Input
                                id="description"
                                type="text"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Descripción del producto o servicio"
                            />
                            <InputError message={errors.description} />
                        </div>
                        
                        <div>
                            <Label htmlFor="quantity">Cantidad</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={data.quantity}
                                onChange={(e) => setData('quantity', parseInt(e.target.value) || 1)}
                                placeholder="1"
                            />
                            <InputError message={errors.quantity} />
                        </div>
                    </div>
                </div>

                {/* Información del pagador */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información del Pagador
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="payer_name">Nombre *</Label>
                            <Input
                                id="payer_name"
                                type="text"
                                value={data.payer_name}
                                onChange={(e) => setData('payer_name', e.target.value)}
                                placeholder="Juan"
                                required
                            />
                            <InputError message={errors.payer_name} />
                        </div>
                        
                        <div>
                            <Label htmlFor="payer_surname">Apellido *</Label>
                            <Input
                                id="payer_surname"
                                type="text"
                                value={data.payer_surname}
                                onChange={(e) => setData('payer_surname', e.target.value)}
                                placeholder="Pérez"
                                required
                            />
                            <InputError message={errors.payer_surname} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="payer_email">Email *</Label>
                            <Input
                                id="payer_email"
                                type="email"
                                value={data.payer_email}
                                onChange={(e) => setData('payer_email', e.target.value)}
                                placeholder="juan.perez@email.com"
                                required
                            />
                            <InputError message={errors.payer_email} />
                        </div>
                        
                        <div>
                            <Label htmlFor="payer_phone">Teléfono</Label>
                            <Input
                                id="payer_phone"
                                type="tel"
                                value={data.payer_phone}
                                onChange={(e) => setData('payer_phone', e.target.value)}
                                placeholder="+54 11 1234-5678"
                            />
                            <InputError message={errors.payer_phone} />
                        </div>
                    </div>
                </div>

                {/* Mostrar error de API si existe */}
                {apiError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="text-sm text-red-600">
                            <strong>Error:</strong> {apiError}
                        </div>
                    </div>
                )}

                {/* Total y botón de pago */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-green-600">
                            ${(Number(data.unit_price) * Number(data.quantity)).toFixed(2)}
                        </span>
                    </div>
                    
                    <Button
                        type="submit"
                        disabled={processing || !data.title || !data.payer_name || !data.payer_email || Number(data.unit_price) <= 0}
                        className="w-full"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                                Procesando pago...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-5 w-5" />
                                Pagar con Mercado Pago
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default PaymentForm;