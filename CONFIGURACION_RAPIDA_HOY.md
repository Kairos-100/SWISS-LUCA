# ⚡ CONFIGURACIÓN RÁPIDA - Completar HOY

## 🎯 **OBJETIVO: Tener todos los métodos de pago funcionando HOY**

---

## ⚡ **PASO 1: Stripe Dashboard (5 minutos)**

### 1.1 Crear cuenta o iniciar sesión
```
https://dashboard.stripe.com
```

### 1.2 Obtener claves API
1. Ve a: **Developers → API Keys**
2. Copia:
   - ✅ **Publishable key** (pk_test_...)
   - ✅ **Secret key** (sk_test_...) - Click "Reveal test key"

### 1.3 Activar TWINT
1. Ve a: **Settings → Payment methods**
2. Busca **TWINT**
3. **Activa el toggle** ✅
4. Configura **Suiza (CH)**

**Apple Pay** se activa automáticamente ✅

---

## ⚡ **PASO 2: Configurar .env (2 minutos)**

**Archivo:** `/Users/guillermohaya/Desktop/LUCA/.env`

**Edita y reemplaza:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_PEGA_TU_CLAVE_AQUI
```

---

## ⚡ **PASO 3: Firebase Functions (3 minutos)**

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Configurar clave secreta
firebase functions:config:set stripe.secret_key="sk_test_PEGA_TU_CLAVE_AQUI"

# Instalar dependencias (si no lo has hecho)
npm install

# Compilar
npm run build

# Desplegar
firebase deploy --only functions
```

---

## ⚡ **PASO 4: Cuenta Bancaria (5 minutos)**

1. **Stripe Dashboard → Settings → Payouts**
2. **Add bank account**
3. Ingresa tu **IBAN suizo**
4. Guarda

---

## ⚡ **PASO 5: Verificación (10 minutos)**

1. **Settings → Verification**
2. Sube documentos:
   - Pasaporte/ID
   - Comprobante domicilio
   - Selfie
3. Espera verificación (puede tardar, pero puedes probar mientras tanto)

---

## ⚡ **PASO 6: Webhook (3 minutos)**

1. **Desplegar funciones primero** (Paso 3)
2. **Developers → Webhooks → Add endpoint**
3. URL: `https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook`
4. Eventos: Todos los de pago
5. Copiar "Signing secret"
6. Configurar:
```bash
firebase functions:config:set stripe.webhook_secret="whsec_TU_SECRET"
firebase deploy --only functions
```

---

## ⚡ **PASO 7: Probar (2 minutos)**

1. Reiniciar servidor: `npm run dev`
2. Hacer swipe en oferta
3. Probar con tarjeta: `4242 4242 4242 4242`

---

## ⏱️ **TIEMPO TOTAL: ~30 minutos**

¡Vamos a hacerlo paso a paso!




