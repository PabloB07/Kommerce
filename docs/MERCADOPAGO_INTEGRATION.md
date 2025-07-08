# Integración de Mercado Pago - Checkout Pro

Esta documentación describe la implementación completa de Mercado Pago Checkout Pro en el proyecto Laravel con React TypeScript.

## Tabla de Contenidos

1. [Configuración](#configuración)
2. [Arquitectura](#arquitectura)
3. [Backend (PHP Laravel)](#backend-php-laravel)
4. [Frontend (React TypeScript)](#frontend-react-typescript)
5. [Webhooks](#webhooks)
6. [Seguridad](#seguridad)
7. [Pruebas](#pruebas)
8. [Uso](#uso)
9. [Troubleshooting](#troubleshooting)

## Configuración

### 1. Instalación del SDK

```bash
composer require mercadopago/dx-php
```

### 2. Variables de Entorno

Agregar al archivo `.env`:

```env
# Mercado Pago Credentials
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
MERCADOPAGO_PUBLIC_KEY=your_public_key_here
MERCADOPAGO_ENVIRONMENT=sandbox # o production

# Webhook Configuration
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here
MERCADOPAGO_WEBHOOK_ENDPOINT=/webhooks/mercadopago

# Return URLs
MERCADOPAGO_SUCCESS_URL=http://localhost:8000/payment/success
MERCADOPAGO_FAILURE_URL=http://localhost:8000/payment/failure
MERCADOPAGO_PENDING_URL=http://localhost:8000/payment/pending
```

### 3. Configuración de Credenciales

Las credenciales se configuran en `config/mercadopago.php` y se obtienen desde:

- **Sandbox**: [Mercado Pago Developers - Test Credentials](https://www.mercadopago.com/developers/panel/credentials)
- **Production**: [Mercado Pago Developers - Production Credentials](https://www.mercadopago.com/developers/panel/credentials)

## Arquitectura

### Componentes Principales

```
app/
├── Services/
│   ├── MercadoPagoService.php          # Servicio principal de pagos
│   └── MercadoPagoWebhookService.php   # Manejo de webhooks
├── Http/Controllers/
│   └── PaymentController.php           # Controlador de pagos
config/
└── mercadopago.php                     # Configuración
resources/js/
├── components/mercadopago/
│   ├── checkout-button.tsx             # Botón de pago rápido
│   └── payment-form.tsx                # Formulario completo
├── hooks/
│   └── use-mercadopago.ts              # Hook personalizado
└── pages/payment/
    ├── checkout.tsx                     # Página de checkout
    ├── success.tsx                      # Página de éxito
    ├── failure.tsx                      # Página de fallo
    └── pending.tsx                      # Página de pendiente
```

## Backend (PHP Laravel)

### MercadoPagoService

Servicio principal que maneja:

- **Inicialización del SDK**: Configuración automática con credenciales
- **Creación de Preferencias**: Generación de preferencias de pago
- **Validación de Datos**: Validación de items y datos del pagador
- **Manejo de Errores**: Captura y formateo de errores de la API

```php
// Ejemplo de uso
$service = new MercadoPagoService();
$result = $service->createPaymentPreference([
    'items' => [...],
    'payer' => [...],
    'external_reference' => 'order_123'
]);
```

### PaymentController

Controlador que expone endpoints:

- `POST /payment/create-preference`: Crear preferencia de pago
- `GET /payment/public-key`: Obtener clave pública
- `POST /webhooks/mercadopago`: Recibir notificaciones
- `GET /payment/{status}`: Páginas de resultado

### Validaciones de Seguridad

1. **Validación de Request**: Validación de datos de entrada
2. **Sanitización**: Limpieza de datos del usuario
3. **Rate Limiting**: Limitación de requests por IP
4. **CSRF Protection**: Protección contra ataques CSRF

## Frontend (React TypeScript)

### Componentes

#### CheckoutButton

Botón de pago rápido con datos predefinidos:

```tsx
<CheckoutButton
  items={[
    {
      id: 'item_1',
      title: 'Producto',
      quantity: 1,
      unit_price: 100.50
    }
  ]}
  payer={{
    email: 'user@example.com'
  }}
  onSuccess={(data) => console.log('Success:', data)}
  onError={(error) => console.log('Error:', error)}
/>
```

#### PaymentForm

Formulario completo para capturar datos del producto y pagador:

```tsx
<PaymentForm
  onSuccess={(data) => handleSuccess(data)}
  onError={(error) => handleError(error)}
/>
```

### Hook Personalizado

`useMercadoPago` proporciona:

- **Estado de Carga**: Manejo de estados loading/error
- **Creación de Preferencias**: Función para crear preferencias
- **Redirección**: Redirección automática a Checkout Pro
- **Manejo de Errores**: Captura y formateo de errores

```tsx
const {
  loading,
  error,
  createPreference,
  processPayment,
  getPublicKey,
  clearError
} = useMercadoPago();
```

## Webhooks

### Configuración

1. **URL del Webhook**: `https://tu-dominio.com/webhooks/mercadopago`
2. **Eventos Soportados**:
   - `payment`: Notificaciones de pago
   - `merchant_order`: Notificaciones de orden

### Validación de Firma

Todos los webhooks son validados usando HMAC SHA256:

```php
// Validación automática en MercadoPagoWebhookService
$isValid = $webhookService->validateSignature($payload, $headers);
```

### Procesamiento

1. **Validación de Firma**: Verificación de autenticidad
2. **Procesamiento por Tipo**: Manejo específico según el tipo
3. **Actualización de Estado**: Actualización del estado de la orden
4. **Logging**: Registro de todas las operaciones

## Seguridad

### Mejores Prácticas Implementadas

1. **Validación de Webhooks**: Verificación de firma HMAC SHA256
2. **Sanitización de Datos**: Limpieza de inputs del usuario
3. **Manejo Seguro de Credenciales**: Uso de variables de entorno
4. **Validación de Timestamps**: Prevención de ataques de replay
5. **Rate Limiting**: Limitación de requests
6. **HTTPS Only**: Uso obligatorio de HTTPS en producción

### Configuración de Seguridad

```php
// En config/mercadopago.php
'security' => [
    'webhook_timeout' => 600, // 10 minutos
    'max_retries' => 3,
    'verify_ssl' => env('APP_ENV') === 'production'
]
```

## Pruebas

### Casos de Prueba Implementados

#### Backend

- **MercadoPagoServiceTest**: Pruebas del servicio principal
- **PaymentControllerTest**: Pruebas de endpoints
- **MercadoPagoWebhookServiceTest**: Pruebas de webhooks

#### Ejecutar Pruebas

```bash
# Todas las pruebas
php artisan test

# Pruebas específicas
php artisan test --filter MercadoPago

# Con coverage
php artisan test --coverage
```

### Datos de Prueba

#### Tarjetas de Prueba (Sandbox)

| Tarjeta | Número | CVV | Vencimiento | Resultado |
|---------|--------|-----|-------------|----------|
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | Aprobada |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | Aprobada |
| Visa | 4013 5406 8274 6260 | 123 | 11/25 | Rechazada |

## Uso

### Flujo Básico

1. **Usuario en Checkout**: Navega a `/payment/checkout`
2. **Selección de Producto**: Completa formulario o usa botón rápido
3. **Creación de Preferencia**: Se crea preferencia en backend
4. **Redirección**: Usuario es redirigido a Mercado Pago
5. **Pago**: Usuario completa el pago
6. **Webhook**: Mercado Pago notifica el resultado
7. **Redirección Final**: Usuario regresa a página de resultado

### Integración en Páginas Existentes

```tsx
// En cualquier componente React
import { CheckoutButton } from '@/components/mercadopago/checkout-button';

function ProductPage() {
  return (
    <div>
      <h1>Mi Producto</h1>
      <CheckoutButton
        items={[{
          id: 'prod_1',
          title: 'Mi Producto',
          quantity: 1,
          unit_price: 99.99
        }]}
        payer={{
          email: user.email
        }}
      />
    </div>
  );
}
```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Credenciales

```
Error: Invalid credentials
```

**Solución**: Verificar que las credenciales en `.env` sean correctas y correspondan al ambiente (sandbox/production).

#### 2. Webhook No Recibido

```
Webhook signature validation failed
```

**Solución**: 
- Verificar que la URL del webhook sea accesible públicamente
- Confirmar que el secreto del webhook sea correcto
- Revisar logs en `storage/logs/laravel.log`

#### 3. Error de CORS

```
CORS policy error
```

**Solución**: Configurar CORS en `config/cors.php` para permitir requests desde Mercado Pago.

#### 4. Timeout en Requests

**Solución**: Aumentar timeout en configuración:

```php
// En config/mercadopago.php
'timeout' => 30 // segundos
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
tail -f storage/logs/laravel.log

# Filtrar logs de Mercado Pago
grep "MercadoPago" storage/logs/laravel.log
```

### Contacto y Soporte

- **Documentación Oficial**: [Mercado Pago Developers](https://www.mercadopago.com/developers)
- **Soporte**: [Centro de Ayuda](https://www.mercadopago.com/ayuda)
- **Comunidad**: [Foro de Desarrolladores](https://www.mercadopago.com/developers/community)

---

**Nota**: Esta integración sigue las mejores prácticas de seguridad y las recomendaciones oficiales de Mercado Pago. Para producción, asegúrate de usar HTTPS y credenciales de producción válidas.