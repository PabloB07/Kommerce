import { useState, useCallback } from 'react';

/**
 * Interfaz para los datos del item de pago
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
 * Interfaz para la respuesta de la API
 */
interface PaymentResponse {
    success: boolean;
    message?: string;
    preference_id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    data?: any;
}

/**
 * Interfaz para el estado del hook
 */
interface MercadoPagoState {
    loading: boolean;
    error: string | null;
    preference: PaymentResponse | null;
}

/**
 * Hook personalizado para manejar la integración con Mercado Pago
 * Proporciona funciones para crear preferencias de pago y manejar el estado
 */
export function useMercadoPago() {
    const [state, setState] = useState<MercadoPagoState>({
        loading: false,
        error: null,
        preference: null,
    });

    /**
     * Obtiene el token CSRF del documento
     */
    const getCsrfToken = useCallback((): string => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            throw new Error('Token CSRF no encontrado');
        }
        return token;
    }, []);

    /**
     * Crea una preferencia de pago en Mercado Pago
     */
    const createPreference = useCallback(async ({
        items,
        payer,
        external_reference,
        statement_descriptor,
        auto_return = 'approved',
        binary_mode = false,
    }: {
        items: PaymentItem[];
        payer?: PayerData;
        external_reference?: string;
        statement_descriptor?: string;
        auto_return?: 'approved' | 'all';
        binary_mode?: boolean;
    }): Promise<PaymentResponse> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Validaciones
            if (!items || items.length === 0) {
                throw new Error('Debe proporcionar al menos un item para el pago');
            }

            // Validar items
            for (const item of items) {
                if (!item.title || item.unit_price <= 0 || item.quantity <= 0) {
                    throw new Error('Todos los items deben tener título, precio y cantidad válidos');
                }
            }

            // Realizar la petición
            const response = await fetch('/payment/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    items,
                    payer,
                    external_reference,
                    statement_descriptor,
                    auto_return,
                    binary_mode,
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Error en la comunicación con el servidor';
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Si no se puede parsear el JSON, usar mensaje genérico
                }
                
                throw new Error(errorMessage);
            }

            const data: PaymentResponse = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al crear la preferencia de pago');
            }

            setState(prev => ({ ...prev, loading: false, preference: data }));
            return data;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setState(prev => ({ ...prev, loading: false, error: errorMessage }));
            throw error;
        }
    }, [getCsrfToken]);

    /**
     * Redirige al usuario a Checkout Pro
     */
    const redirectToCheckout = useCallback((initPoint: string, newTab = false) => {
        if (!initPoint) {
            throw new Error('URL de checkout no válida');
        }

        if (newTab) {
            window.open(initPoint, '_blank');
        } else {
            window.location.href = initPoint;
        }
    }, []);

    /**
     * Procesa un pago completo (crear preferencia + redirigir)
     */
    const processPayment = useCallback(async ({
        items,
        payer,
        external_reference,
        statement_descriptor,
        auto_return = 'approved',
        binary_mode = false,
        newTab = false,
        onSuccess,
        onError,
    }: {
        items: PaymentItem[];
        payer?: PayerData;
        external_reference?: string;
        statement_descriptor?: string;
        auto_return?: 'approved' | 'all';
        binary_mode?: boolean;
        newTab?: boolean;
        onSuccess?: (data: PaymentResponse) => void;
        onError?: (error: Error) => void;
    }) => {
        try {
            const preference = await createPreference({
                items,
                payer,
                external_reference,
                statement_descriptor,
                auto_return,
                binary_mode,
            });

            if (preference.init_point) {
                // Ejecutar callback de éxito antes de redirigir
                if (onSuccess) {
                    onSuccess(preference);
                }

                // Redirigir a Checkout Pro
                redirectToCheckout(preference.init_point, newTab);
            } else {
                throw new Error('No se pudo obtener la URL de checkout');
            }

        } catch (error) {
            if (onError && error instanceof Error) {
                onError(error);
            }
            throw error;
        }
    }, [createPreference, redirectToCheckout]);

    /**
     * Obtiene la clave pública de Mercado Pago
     */
    const getPublicKey = useCallback(async (): Promise<string> => {
        try {
            const response = await fetch('/payment/public-key', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener la clave pública');
            }

            const data = await response.json();
            
            if (!data.success || !data.public_key) {
                throw new Error('Clave pública no disponible');
            }

            return data.public_key;

        } catch (error) {
            console.error('Error al obtener la clave pública:', error);
            throw error;
        }
    }, [getCsrfToken]);

    /**
     * Limpia el estado del hook
     */
    const clearState = useCallback(() => {
        setState({
            loading: false,
            error: null,
            preference: null,
        });
    }, []);

    /**
     * Limpia solo el error
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        // Estado
        loading: state.loading,
        error: state.error,
        preference: state.preference,
        
        // Funciones
        createPreference,
        redirectToCheckout,
        processPayment,
        getPublicKey,
        clearState,
        clearError,
    };
}

export default useMercadoPago;