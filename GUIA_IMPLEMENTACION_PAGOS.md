# 🚀 GUÍA DE IMPLEMENTACIÓN DE PAGOS - LUCA APP

## 📋 ÍNDICE
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Stripe](#configuración-de-stripe)
3. [Configuración del Proyecto](#configuración-del-proyecto)
4. [Despliegue del Backend](#despliegue-del-backend)
5. [Despliegue de Firebase Functions](#despliegue-de-firebase-functions)
6. [Testing](#testing)
7. [Producción](#producción)
8. [Troubleshooting](#troubleshooting)

---

## 1. REQUISITOS PREVIOS

### ✅ Cuentas Necesarias

1. **Stripe** (OBLIGATORIO)
   - Crear cuenta en https://stripe.com
   - Verificar cuenta para pagos reales
   - Activar TWINT en los métodos de pago

2. **Firebase** (YA CONFIGURADO)
   - Tu proyecto: `t4learningluca`
   - Ya tienes Auth y Firestore configurados

3. **Hosting para Backend** (ELEGIR UNO)
   - Opción A: **Railway** (Recomendado - Fácil y gratis para empezar)
   - Opción B: **Heroku**
   - Opción C: **Google Cloud Run**
   - Opción D: **AWS Lambda**

### ✅ Herramientas Necesarias

```bash
# Node.js y npm (ya lo tienes)
node --version  # Debe ser v18 o superior
npm --version

# Firebase CLI
npm install -g firebase-tools
firebase --version

# Git (para desplegar)
git --version
```

---

## 2. CONFIGURACIÓN DE STRIPE

### Paso 1: Crear Cuenta y Obtener Claves

1. **Ir a Stripe Dashboard**
   ```
   https://dashboard.stripe.com
   ```

2. **Ir a Developers > API Keys**
   - Encontrarás dos claves en modo TEST:
     - ✅ `Publishable key`: `pk_test_...`
     - ✅ `Secret key`: `sk_test_...`

3. **Guardar las claves** (las necesitarás más adelante)

### Paso 2: Habilitar TWINT

1. **Ir a Settings > Payment methods**
2. **Buscar "TWINT"**
3. **Activar TWINT**
4. **Configurar para Suiza** (CHF)

### Paso 3: Configurar Webhooks

1. **Ir a Developers > Webhooks**
2. **Click en "Add endpoint"**
3. **URL del webhook:** (la obtendrás después de desplegar)
   ```
   https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook
   ```

4. **Seleccionar eventos:**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. **Copiar el "Signing secret"** (whsec_...)

---

## 3. CONFIGURACIÓN DEL PROYECTO

### Paso 1: Crear Archivo .env en la Raíz

```bash
cd /Users/guillermohaya/Desktop/LUCA
touch .env
```

Agregar el siguiente contenido:

```env
# ========================================
# STRIPE KEYS
# ========================================
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI

# ========================================
# FIREBASE (Ya configurado)
# ========================================
REACT_APP_FIREBASE_API_KEY=AIzaSyC2ktQHVwr8TbV64_wFBbE_aob3haObNgE
REACT_APP_FIREBASE_PROJECT_ID=t4learningluca

# ========================================
# GOOGLE MAPS
# ========================================
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBbnCxckdR0XrhYorXJHXPlIx-58MPcva0

# ========================================
# BACKEND URL (actualizar después de desplegar)
# ========================================
REACT_APP_API_URL=http://localhost:3001

# ========================================
# CONFIGURACIÓN
# ========================================
NODE_ENV=development
REACT_APP_PAYMENT_TEST_MODE=true
REACT_APP_PAYMENT_PROVIDER=stripe
```

### Paso 2: Crear Archivo .env en Backend

```bash
cd backend
touch .env
```

Agregar:

```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI

PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
```

### Paso 3: Configurar Firebase Functions

```bash
cd functions
firebase functions:config:set \
  stripe.secret_key="sk_test_TU_CLAVE_AQUI" \
  stripe.webhook_secret="whsec_TU_WEBHOOK_SECRET_AQUI"
```

### Paso 4: Verificar Dependencias

```bash
# En la raíz
npm install

# En backend
cd backend
npm install

# En functions
cd ../functions
npm install
```

---

## 4. DESPLIEGUE DEL BACKEND

### OPCIÓN A: Railway (Recomendado)

#### 1. Crear cuenta en Railway
```
https://railway.app
```

#### 2. Instalar Railway CLI
```bash
npm install -g @railway/cli
```

#### 3. Login y crear proyecto
```bash
railway login
cd backend
railway init
```

#### 4. Configurar variables de entorno en Railway
```bash
railway variables set STRIPE_SECRET_KEY="sk_test_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://t4learningluca.web.app"
```

#### 5. Desplegar
```bash
railway up
```

#### 6. Obtener URL
```bash
railway open
# Copiar la URL, ejemplo: https://tu-app.railway.app
```

#### 7. Actualizar .env en la raíz
```env
REACT_APP_API_URL=https://tu-app.railway.app
```

### OPCIÓN B: Heroku

```bash
# Instalar Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Crear app
cd backend
heroku create luca-backend

# Configurar variables
heroku config:set STRIPE_SECRET_KEY="sk_test_..."
heroku config:set STRIPE_WEBHOOK_SECRET="whsec_..."
heroku config:set NODE_ENV="production"
heroku config:set FRONTEND_URL="https://t4learningluca.web.app"

# Desplegar
git add .
git commit -m "Deploy backend"
git push heroku main

# Obtener URL
heroku open
```

---

## 5. DESPLIEGUE DE FIREBASE FUNCTIONS

### Paso 1: Login en Firebase

```bash
firebase login
```

### Paso 2: Seleccionar Proyecto

```bash
firebase use t4learningluca
```

### Paso 3: Compilar Functions

```bash
cd functions
npm run build
```

### Paso 4: Desplegar

```bash
firebase deploy --only functions
```

Esto desplegará:
- ✅ `createPaymentIntent`
- ✅ `createSubscription`
- ✅ `cancelSubscription`
- ✅ `stripeWebhook`
- ✅ `checkExpiredSubscriptions`
- ✅ `api`

### Paso 5: Obtener URLs

```bash
firebase functions:list
```

Copiar la URL del webhook:
```
https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook
```

### Paso 6: Configurar Webhook en Stripe

1. Ir a https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Pegar la URL del webhook
4. Seleccionar los eventos (ver sección 2.3)
5. Copiar el "Signing secret"

### Paso 7: Actualizar Configuración

```bash
firebase functions:config:set \
  stripe.webhook_secret="whsec_EL_NUEVO_SECRET_AQUI"

# Redesplegar
firebase deploy --only functions
```

---

## 6. TESTING

### Test 1: Backend Funcionando

```bash
# Verificar que el backend responde
curl https://tu-backend-url.railway.app/health

# Debería responder:
# {"status":"OK","timestamp":"..."}
```

### Test 2: Firebase Functions

```bash
# En la consola de Firebase
# https://console.firebase.google.com/project/t4learningluca/functions

# Verificar que todas las funciones están desplegadas
```

### Test 3: Crear Pago de Prueba

```bash
# En tu terminal
node test-payment.js
```

Crear archivo `test-payment.js`:
```javascript
const stripe = require('stripe')('sk_test_TU_CLAVE_AQUI');

async function testPayment() {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 999, // 9.99 CHF
      currency: 'chf',
      payment_method_types: ['card', 'twint'],
    });
    
    console.log('✅ Payment Intent creado:', paymentIntent.id);
    console.log('Client Secret:', paymentIntent.client_secret);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPayment();
```

### Test 4: Probar en la App

1. **Abrir la app en desarrollo**
   ```bash
   npm start
   ```

2. **Crear cuenta de prueba**
   - Email: test@example.com
   - Password: Test123!

3. **Intentar suscribirse**
   - Seleccionar plan mensual
   - Debería abrir modal de pago

4. **Usar tarjeta de prueba de Stripe**
   ```
   Número: 4242 4242 4242 4242
   Fecha: Cualquier fecha futura
   CVC: Cualquier 3 dígitos
   ```

5. **Verificar que el pago se procesa**

### Test 5: Verificar Webhooks

1. **Ir a Stripe Dashboard > Webhooks**
2. **Verificar que los eventos llegan correctamente**
3. **Ver logs en Firebase Console**
   ```
   https://console.firebase.google.com/project/t4learningluca/functions/logs
   ```

---

## 7. PRODUCCIÓN

### Paso 1: Cambiar a Claves de Producción

1. **En Stripe Dashboard**
   - Cambiar de "Test mode" a "Live mode"
   - Copiar las claves LIVE:
     - `pk_live_...`
     - `sk_live_...`

2. **Actualizar variables de entorno**
   
   **Frontend (.env):**
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_TU_CLAVE_LIVE
   REACT_APP_PAYMENT_TEST_MODE=false
   NODE_ENV=production
   ```

   **Backend (Railway/Heroku):**
   ```bash
   railway variables set STRIPE_SECRET_KEY="sk_live_..."
   railway variables set NODE_ENV="production"
   ```

   **Firebase Functions:**
   ```bash
   firebase functions:config:set \
     stripe.secret_key="sk_live_..."
   
   firebase deploy --only functions
   ```

### Paso 2: Configurar Webhook de Producción

1. Crear nuevo webhook en Stripe con URL de producción
2. Copiar nuevo "Signing secret"
3. Actualizar en Firebase Functions

### Paso 3: Desplegar Frontend

```bash
# Build de producción
npm run build

# Desplegar a Firebase Hosting
firebase deploy --only hosting
```

### Paso 4: Verificar Todo Funciona

1. ✅ Frontend carga correctamente
2. ✅ Backend responde
3. ✅ Pagos se procesan
4. ✅ Webhooks funcionan
5. ✅ Suscripciones se activan
6. ✅ Ofertas flash se pueden comprar

---

## 8. TROUBLESHOOTING

### ❌ Error: "Stripe publishable key no configurada"

**Solución:**
```bash
# Verificar que el archivo .env existe
cat .env | grep STRIPE

# Si no existe, crearlo con las claves correctas
```

### ❌ Error: "CORS policy blocked"

**Solución:**
```javascript
// En backend/server.js, verificar:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### ❌ Error: "Firebase Functions not found"

**Solución:**
```bash
# Redesplegar functions
cd functions
npm run build
firebase deploy --only functions
```

### ❌ Error: "Webhook signature verification failed"

**Solución:**
```bash
# Verificar que el webhook secret es correcto
firebase functions:config:get

# Si no coincide, actualizar:
firebase functions:config:set \
  stripe.webhook_secret="whsec_CORRECTO"

firebase deploy --only functions
```

### ❌ Error: "Payment failed"

**Solución:**
1. Verificar que las claves de Stripe son correctas
2. Verificar que TWINT está habilitado
3. Ver logs en Stripe Dashboard > Logs

### ❌ Error: "Subscription not activating"

**Solución:**
1. Verificar webhooks en Stripe
2. Ver logs de Firebase Functions
3. Verificar que el webhook está configurado correctamente

---

## 📊 CHECKLIST FINAL

Antes de considerar que todo está funcionando, verificar:

### Configuración
- [ ] Archivo .env creado con todas las claves
- [ ] Backend desplegado y funcionando
- [ ] Firebase Functions desplegadas
- [ ] Webhooks configurados en Stripe
- [ ] Variables de entorno configuradas

### Testing
- [ ] Pago de prueba funciona
- [ ] Suscripción de prueba funciona
- [ ] Webhooks reciben eventos
- [ ] Firebase actualiza correctamente
- [ ] UI muestra estado correcto

### Producción
- [ ] Claves de producción configuradas
- [ ] Frontend desplegado
- [ ] Backend en producción
- [ ] Webhook de producción configurado
- [ ] Todo probado con pagos reales

---

## 🆘 SOPORTE

Si encuentras problemas:

1. **Ver logs de Firebase Functions**
   ```bash
   firebase functions:log
   ```

2. **Ver logs de Backend**
   ```bash
   # Railway
   railway logs
   
   # Heroku
   heroku logs --tail
   ```

3. **Ver eventos de Stripe**
   ```
   https://dashboard.stripe.com/events
   ```

4. **Ver webhooks de Stripe**
   ```
   https://dashboard.stripe.com/webhooks
   ```

---

## 📚 RECURSOS

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Firebase Functions:** https://firebase.google.com/docs/functions
- **Railway Docs:** https://docs.railway.app

---

## 🎉 ¡LISTO!

Si has seguido todos los pasos correctamente, tu aplicación LUCA debería estar funcionando perfectamente con:

- ✅ Pagos con Stripe
- ✅ Soporte para TWINT
- ✅ Suscripciones mensuales y anuales
- ✅ Ofertas flash con pago
- ✅ Sistema de usuarios separados
- ✅ Webhooks automáticos
- ✅ Renovación automática de suscripciones

**¡Solo falta agregar el método de pago y ya está todo conectado!** 🚀

---

*Guía actualizada: ${new Date().toLocaleDateString('es-ES')}*










