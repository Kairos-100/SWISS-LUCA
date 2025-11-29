# 🔧 Guía Completa: Dónde Configurar Todo para Pagos

## 📋 ÍNDICE
1. [Archivos .env a Crear](#archivos-env)
2. [Claves de Stripe](#claves-stripe)
3. [Firebase Functions](#firebase-functions)
4. [Verificación de Documentos](#verificacion)
5. [Checklist Final](#checklist)

---

## 📁 1. ARCHIVOS .ENV A CREAR

### ✅ Archivo 1: `.env` (Raíz del proyecto)

**Ubicación:** `/Users/guillermohaya/Desktop/LUCA/.env`

**Crear el archivo:**
```bash
cd /Users/guillermohaya/Desktop/LUCA
touch .env
```

**Contenido:**
```env
# ========================================
# STRIPE - CLAVES PÚBLICAS (Frontend)
# ========================================
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
# Para producción cambiar a: pk_live_tu_clave_publica_aqui

# ========================================
# FIREBASE (Ya configurado)
# ========================================
VITE_FIREBASE_API_KEY=AIzaSyC2ktQHVwr8TbV64_wFBbE_aob3haObNgE
VITE_FIREBASE_AUTH_DOMAIN=t4learningluca.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=t4learningluca
VITE_FIREBASE_STORAGE_BUCKET=t4learningluca.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# ========================================
# FIREBASE FUNCTIONS URL
# ========================================
REACT_APP_API_URL=https://europe-west1-t4learningluca.cloudfunctions.net

# ========================================
# CONFIGURACIÓN DE PAGOS
# ========================================
REACT_APP_PAYMENT_TEST_MODE=true
# Cambiar a false cuando estés en producción

# ========================================
# GOOGLE MAPS (Opcional)
# ========================================
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_key
```

---

### ✅ Archivo 2: `backend/.env` (Backend Express - Opcional)

**Ubicación:** `/Users/guillermohaya/Desktop/LUCA/backend/.env`

**Crear el archivo:**
```bash
cd /Users/guillermohaya/Desktop/LUCA/backend
touch .env
```

**Contenido:**
```env
# ========================================
# STRIPE - CLAVES SECRETAS (Backend)
# ========================================
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# ========================================
# SERVIDOR
# ========================================
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**⚠️ NOTA:** Este backend es opcional. Tu app usa Firebase Functions, así que este archivo solo es necesario si quieres usar el backend Express también.

---

## 🔑 2. CLAVES DE STRIPE

### Paso 1: Obtener Claves de Stripe

1. **Ve a Stripe Dashboard:**
   ```
   https://dashboard.stripe.com
   ```

2. **Inicia sesión** o crea una cuenta

3. **Ve a Developers → API Keys:**
   ```
   https://dashboard.stripe.com/apikeys
   ```

4. **Copia las claves:**
   - ✅ **Publishable key** (pk_test_...) → Va en `.env` como `REACT_APP_STRIPE_PUBLISHABLE_KEY`
   - ✅ **Secret key** (sk_test_...) → Va en Firebase Functions (ver abajo)

### Paso 2: Activar Métodos de Pago

1. **Settings → Payment methods**
2. **Activar TWINT** (toggle ON)
3. **Apple Pay** se activa automáticamente

---

## ☁️ 3. FIREBASE FUNCTIONS

### Paso 1: Configurar Secret Key en Firebase

**Opción A: Usando Firebase CLI (Recomendado)**

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Configurar la clave secreta de Stripe
firebase functions:config:set stripe.secret_key="sk_test_tu_clave_secreta_aqui"

# Configurar webhook secret (obtener de Stripe Dashboard)
firebase functions:config:set stripe.webhook_secret="whsec_tu_webhook_secret_aqui"
```

**Opción B: Usando Firebase Secrets (Más Seguro)**

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Configurar secret de Stripe
firebase functions:secrets:set STRIPE_SECRET_KEY
# Cuando te pregunte, ingresa: sk_test_tu_clave_secreta_aqui

# Configurar webhook secret
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Cuando te pregunte, ingresa: whsec_tu_webhook_secret_aqui
```

**Luego actualizar `functions/src/index.ts` para usar secrets:**

```typescript
// Cambiar de:
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {

// A (si usas secrets):
import { defineSecret } from 'firebase-functions/params';
const stripeSecret = defineSecret('STRIPE_SECRET_KEY');
const stripe = new Stripe(stripeSecret.value(), {
```

### Paso 2: Desplegar Firebase Functions

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Desplegar funciones
firebase deploy --only functions
```

---

## 📄 4. VERIFICACIÓN DE DOCUMENTOS EN STRIPE

### Paso 1: Completar Información de Negocio

1. **Stripe Dashboard → Settings → Business settings**
2. **Completa:**
   - Nombre del negocio
   - Tipo de negocio (Individual/Empresa)
   - País: Suiza (CH)
   - Dirección completa
   - Número de teléfono
   - Email de contacto

### Paso 2: Agregar Cuenta Bancaria

1. **Settings → Payouts → Add bank account**
2. **Ingresa:**
   - IBAN suizo (ej: `CH93 0076 2011 6238 5295 7`)
   - Nombre del titular
   - Tipo de cuenta (Corriente/Ahorros)

### Paso 3: Verificar Identidad (KYC)

1. **Settings → Verification**
2. **Sube documentos:**
   - Pasaporte o documento de identidad
   - Comprobante de domicilio
   - Selfie con documento
3. **Espera verificación** (1-3 días)

### Paso 4: Configurar Webhook

1. **Developers → Webhooks → Add endpoint**
2. **URL del webhook:**
   ```
   https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook
   ```
3. **Eventos a escuchar:**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
4. **Copia el "Signing secret"** (whsec_...)
5. **Configúralo en Firebase Functions** (ver arriba)

---

## ✅ 5. CHECKLIST FINAL

### Archivos a Crear:
- [ ] `.env` en la raíz del proyecto
- [ ] `backend/.env` (opcional)

### Stripe Dashboard:
- [ ] Cuenta creada y verificada
- [ ] Claves API obtenidas (pk_test_ y sk_test_)
- [ ] TWINT activado
- [ ] Apple Pay activado (automático)
- [ ] Información de negocio completa
- [ ] Cuenta bancaria agregada
- [ ] Identidad verificada (KYC)
- [ ] Webhook configurado

### Firebase:
- [ ] Clave secreta configurada en Functions
- [ ] Webhook secret configurado
- [ ] Functions desplegadas

### Variables de Entorno:
- [ ] `REACT_APP_STRIPE_PUBLISHABLE_KEY` en `.env`
- [ ] `REACT_APP_API_URL` en `.env`
- [ ] `REACT_APP_PAYMENT_TEST_MODE` en `.env`

---

## 🚀 COMANDOS RÁPIDOS

### Crear archivos .env:
```bash
# En la raíz
cd /Users/guillermohaya/Desktop/LUCA
cp env.example .env
# Editar .env con tus claves

# En backend (opcional)
cd backend
cp env.example .env
# Editar .env con tus claves
```

### Configurar Firebase Functions:
```bash
cd functions
firebase functions:config:set stripe.secret_key="sk_test_TU_CLAVE"
firebase functions:config:set stripe.webhook_secret="whsec_TU_SECRET"
firebase deploy --only functions
```

---

## 📍 RESUMEN: DÓNDE VA CADA COSA

| Qué | Dónde | Archivo |
|-----|-------|---------|
| **Clave pública Stripe** | Frontend | `.env` → `REACT_APP_STRIPE_PUBLISHABLE_KEY` |
| **Clave secreta Stripe** | Backend | Firebase Functions config |
| **Webhook secret** | Backend | Firebase Functions config |
| **URL de Functions** | Frontend | `.env` → `REACT_APP_API_URL` |
| **Cuenta bancaria** | Stripe Dashboard | Settings → Payouts |
| **Documentos KYC** | Stripe Dashboard | Settings → Verification |
| **Webhook URL** | Stripe Dashboard | Developers → Webhooks |

---

## ⚠️ IMPORTANTE

1. **NUNCA subas `.env` a Git** (ya está en `.gitignore`)
2. **Usa claves `pk_test_` y `sk_test_` para desarrollo**
3. **Cambia a `pk_live_` y `sk_live_` para producción**
4. **Verifica tu identidad antes de recibir pagos reales**

---

## 🎯 SIGUIENTE PASO

Una vez configurado todo:
1. Reinicia el servidor de desarrollo
2. Prueba con tarjetas de prueba de Stripe
3. Verifica que los pagos funcionen
4. ¡Listo para producción!




