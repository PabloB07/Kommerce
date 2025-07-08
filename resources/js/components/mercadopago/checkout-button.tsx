import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle, CreditCard } from 'lucide-react';
import { router } from '@inertiajs/react';

/**
 * Interfaz para los datos del item a pagar
 */
interface PaymentItem {
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
}

/**
 * Interfaz para los datos del pagador
 */
interface PayerData {
    name?: string;
    surname?: string;
    email?: string;
    phone?: {
        area_code?: string;
        number?: string;
    };
    identification?: {
        type?: string;
        number?: string;
    };
    address?: {
        street_name?: string;
        street_number?: string;
        zip_code?: string;
    };
}

/**
 * Props del componente CheckoutButton
 */
interface CheckoutButtonProps {
    items: PaymentItem[];
    payer?: PayerData;
    external_reference?: string;
    statement_descriptor?: string;
    className?: string;
    children?: React.ReactNode;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    disabled?: boolean;
}

/**
 * Componente de botón de checkout de Mercado Pago
 * Integra Checkout Pro para procesar pagos de forma segura
 */
export function CheckoutButton({
    items,
    payer,
    external_reference,
    statement_descriptor,
    className,
    children,
    onSuccess,
    onError,
    disabled = false
}: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Maneja el proceso de creación de preferencia y redirección a Checkout Pro
     */
    const handlePayment = async () => {
        if (disabled || loading) return;

        setLoading(true);
        setError(null);

        try {
            // Validar que hay items para procesar
            if (!items || items.length === 0) {
                throw new Error('No hay items para procesar el pago');
            }

            // Crear la preferencia de pago
            const response = await fetch('/payment/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    items,
                    payer,
                    external_reference,
                    statement_descriptor,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la preferencia de pago');
            }

            const data = await response.json();

            if (!data.success || !data.init_point) {
                throw new Error(data.message || 'No se pudo obtener el enlace de pago');
            }

            // Ejecutar callback de éxito si existe
            if (onSuccess) {
                onSuccess(data);
            }

            // Redirigir a Checkout Pro
            window.location.href = data.init_point;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            
            // Ejecutar callback de error si existe
            if (onError) {
                onError(err);
            }

            console.error('Error en el proceso de pago:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Button
                onClick={handlePayment}
                disabled={disabled || loading || !items || items.length === 0}
                className={className}
                variant="default"
                size="default"
            >
                {loading ? (
                    <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Procesando...
                    </>
                ) : (
                    <>
                        <CreditCard className="h-4 w-4" />
                        {children || 'Pagar con Mercado Pago'}
                    </>
                )}
            </Button>
            
            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
}

export default CheckoutButton;