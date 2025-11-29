# 🚀 GUÍA PASO A PASO - Configuración Completa de Pagos

## ✅ **PASO 1: Crear Cuenta en Stripe y Obtener Claves**

### 1.1 Crear cuenta en Stripe
1. Ve a: **https://stripe.com**
2. Haz clic en **"Start now"** o **"Sign up"**
3. Completa el registro con tu email
4. Verifica tu email

### 1.2 Obtener Claves API
1. Una vez dentro del Dashboard, ve a: **Developers → API Keys**
   - O directamente: https://dashboard.stripe.com/apikeys
2. Verás dos claves en modo **Test**:
   - ✅ **Publishable key** (pk_test_...) → **CÓPIALA**
   - ✅ **Secret key** (sk_test_...) → **CÓPIALA** (haz clic en "Reveal test key")

3. **Guarda estas claves** (las necesitarás en los siguientes pasos)

---

## ✅ **PASO 2: Crear Archivo .env**

### 2.1 Crear el archivo
```bash
cd /Users/guillermohaya/Desktop/LUCA
touch .env
```

### 2.2 Agregar contenido
Abre el archivo `.env` y agrega:

```env
# Clave pública de Stripe (la que copiaste en el Paso 1)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_PEGA_AQUI_TU_CLAVE_PUBLICA

# URL de Firebase Functions
REACT_APP_API_URL=https://europe-west1-t4learningluca.cloudfunctions.net

# Modo de prueba (true = desarrollo, false = producción)
REACT_APP_PAYMENT_TEST_MODE=true
```

**⚠️ IMPORTANTE:** Reemplaza `pk_test_PEGA_AQUI_TU_CLAVE_PUBLICA` con la clave real que copiaste.

---

## ✅ **PASO 3: Configurar Firebase Functions**

### 3.1 Verificar proyecto de Firebase
```bash
cd /Users/guillermohaya/Desktop/LUCA
firebase use t4learningluca
```

Si no funciona, lista los proyectos:
```bash
firebase projects:list
```

### 3.2 Configurar clave secreta de Stripe
```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Configurar la clave secreta (usa la que copiaste en el Paso 1)
firebase functions:config:set stripe.secret_key="sk_test_PEGA_AQUI_TU_CLAVE_SECRETA"
```

**⚠️ IMPORTANTE:** Reemplaza `sk_test_PEGA_AQUI_TU_CLAVE_SECRETA` con tu clave real.

### 3.3 Instalar dependencias (si no lo has hecho)
```bash
cd /Users/guillermohaya/Desktop/LUCA/functions
npm install
```

---

## ✅ **PASO 4: Activar TWINT en Stripe Dashboard**

1. Ve a: **https://dashboard.stripe.com/settings/payment_methods**
2. Busca **"TWINT"** en la lista
3. Haz clic en el **toggle para activarlo** ✅
4. Configura **Suiza (CH)** como país permitido
5. Guarda los cambios

**Apple Pay** se activa automáticamente (no necesitas hacer nada).

---

## ✅ **PASO 5: Agregar Cuenta Bancaria**

1. Ve a: **https://dashboard.stripe.com/settings/payouts**
2. Haz clic en **"Add bank account"** o **"Agregar cuenta bancaria"**
3. Selecciona **Suiza** como país
4. Ingresa tu **IBAN suizo** (ejemplo: `CH93 0076 2011 6238 5295 7`)
5. Ingresa el **nombre del titular** (debe coincidir con tu nombre en Stripe)
6. Selecciona el **tipo de cuenta** (Corriente o Ahorros)
7. Haz clic en **"Add bank account"**

**⚠️ NOTA:** La primera transferencia puede tardar hasta 7 días. Las siguientes serán más rápidas (1-2 días).

---

## ✅ **PASO 6: Verificar Identidad (KYC)**

1. Ve a: **https://dashboard.stripe.com/settings/verification**
2. Completa la información requerida:
   - Tipo de negocio (Individual/Empresa)
   - Información personal
3. Sube los documentos:
   - ✅ **Pasaporte** o documento de identidad
   - ✅ **Comprobante de domicilio** (factura, extracto bancario)
   - ✅ **Selfie** sosteniendo el documento
4. Espera la verificación (1-3 días hábiles)

**⚠️ IMPORTANTE:** Sin verificación, no podrás recibir pagos reales.

---

## ✅ **PASO 7: Configurar Webhook**

### 7.1 Primero, desplegar las funciones (para obtener la URL)
```bash
cd /Users/guillermohaya/Desktop/LUCA/functions
firebase deploy --only functions
```

### 7.2 Configurar webhook en Stripe
1. Ve a: **https://dashboard.stripe.com/webhooks**
2. Haz clic en **"Add endpoint"**
3. **URL del endpoint:**
   ```
   https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook
   ```
4. **Eventos a escuchar:**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Haz clic en **"Add endpoint"**
6. **Copia el "Signing secret"** (whsec_...)

### 7.3 Configurar webhook secret en Firebase
```bash
cd /Users/guillermohaya/Desktop/LUCA/functions
firebase functions:config:set stripe.webhook_secret="whsec_PEGA_AQUI_TU_WEBHOOK_SECRET"
```

### 7.4 Redesplegar funciones
```bash
firebase deploy --only functions
```

---

## ✅ **PASO 8: Desplegar Firebase Functions**

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Compilar TypeScript
npm run build

# Desplegar
firebase deploy --only functions
```

**Espera a que termine** (puede tardar 2-5 minutos).

---

## ✅ **PASO 9: Probar el Sistema**

### 9.1 Reiniciar servidor de desarrollo
```bash
cd /Users/guillermohaya/Desktop/LUCA
npm run dev
```

### 9.2 Probar con tarjeta de prueba
1. Abre tu app en el navegador
2. Haz swipe en una oferta con precio
3. Debería abrirse el modal de pago
4. Usa esta tarjeta de prueba:
   - **Número:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/25)
   - **CVC:** Cualquier 3 dígitos (ej: 123)
   - **Código postal:** Cualquier código

5. Completa el pago
6. Debería aparecer el countdown
7. Después del countdown, la oferta se activa

---

## ✅ **PASO 10: Verificar que Todo Funciona**

### Checklist:
- [ ] Modal de pago se abre correctamente
- [ ] Puedes ingresar datos de tarjeta
- [ ] El pago se procesa (en modo test)
- [ ] El countdown aparece después del pago
- [ ] La oferta se activa después del countdown
- [ ] Los pagos aparecen en Stripe Dashboard

---

## 🎯 **RESUMEN DE ARCHIVOS Y CONFIGURACIONES**

| Qué | Dónde | Valor |
|-----|-------|-------|
| Clave pública Stripe | `.env` | `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...` |
| Clave secreta Stripe | Firebase Functions | `firebase functions:config:set stripe.secret_key="sk_test_..."` |
| Webhook secret | Firebase Functions | `firebase functions:config:set stripe.webhook_secret="whsec_..."` |
| Cuenta bancaria | Stripe Dashboard | Settings → Payouts |
| Documentos KYC | Stripe Dashboard | Settings → Verification |

---

## 🚨 **SI ALGO NO FUNCIONA**

### Error: "Stripe no inicializado"
- ✅ Verifica que `.env` existe y tiene la clave correcta
- ✅ Reinicia el servidor de desarrollo

### Error: "Functions no encontradas"
- ✅ Verifica que desplegaste las funciones
- ✅ Verifica la URL en `.env` es correcta

### Error: "Webhook no funciona"
- ✅ Verifica que configuraste el webhook secret
- ✅ Verifica que la URL del webhook es correcta
- ✅ Redesplega las funciones después de configurar el secret

---

## 🎉 **¡LISTO!**

Una vez completados todos los pasos, tu sistema de pagos estará funcionando completamente.

**Próximos pasos:**
- Probar con tarjetas de prueba
- Cuando estés listo, cambiar a claves de producción (`pk_live_` y `sk_live_`)
- Activar pagos reales




