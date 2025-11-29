# 🔑 Configuración de la API de Stripe - GUÍA RÁPIDA

## ✅ Lo que acabamos de configurar

1. ✅ **Archivo `.env` creado** con la estructura para la clave pública de Stripe
2. ✅ **Firebase Functions actualizado** para usar las variables de entorno correctamente
3. ✅ **Código preparado** para recibir las claves de Stripe

---

## 📋 PASOS PARA COMPLETAR LA CONFIGURACIÓN

### **PASO 1: Obtener las Claves de Stripe** (5 minutos)

1. **Ve a Stripe Dashboard:**
   - URL: https://dashboard.stripe.com
   - Inicia sesión o crea una cuenta si no tienes una

2. **Obtener las claves:**
   - Ve a: **Developers → API Keys**
   - O directamente: https://dashboard.stripe.com/apikeys
   - Verás dos claves en modo **Test**:
     - ✅ **Publishable key** (pk_test_...) → **CÓPIALA**
     - ✅ **Secret key** (sk_test_...) → **CÓPIALA** (haz clic en "Reveal test key")

3. **Guarda estas claves** (las necesitarás en los siguientes pasos)

---

### **PASO 2: Configurar el Frontend (.env)**

El archivo `.env` ya está creado en la raíz del proyecto. Solo necesitas agregar tu clave pública:

```bash
# Abre el archivo .env
cd /Users/guillermohaya/Desktop/LUCA
nano .env  # o usa tu editor preferido
```

**Busca esta línea:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_REEMPLAZA_CON_TU_CLAVE_PUBLICA_AQUI
```

**Y reemplázala con tu clave real:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_REAL_AQUI
```

**Ejemplo:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123xyz...
```

---

### **PASO 3: Configurar Firebase Functions (Backend)**

#### **Opción A: Usando Firebase Secrets (Recomendado - Más Seguro)**

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Configurar la clave secreta de Stripe
firebase functions:secrets:set STRIPE_SECRET_KEY
# Cuando te pregunte, pega tu clave secreta (sk_test_...)

# Configurar webhook secret (obtenerlo después de configurar el webhook)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Cuando te pregunte, pega tu webhook secret (whsec_...)
```

#### **Opción B: Usando Firebase Config (Alternativa)**

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Configurar la clave secreta de Stripe
firebase functions:config:set stripe.secret_key="sk_test_TU_CLAVE_SECRETA_AQUI"

# Configurar webhook secret
firebase functions:config:set stripe.webhook_secret="whsec_TU_WEBHOOK_SECRET_AQUI"
```

**⚠️ NOTA:** Reemplaza `TU_CLAVE_SECRETA_AQUI` y `TU_WEBHOOK_SECRET_AQUI` con tus valores reales.

---

### **PASO 4: Configurar Webhook en Stripe** (Opcional - para producción)

1. **Ve a Stripe Dashboard:**
   - URL: https://dashboard.stripe.com/webhooks
   
2. **Crear webhook:**
   - Haz clic en **"Add endpoint"**
   - URL del endpoint:
     ```
     https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook
     ```
   - Selecciona eventos:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
   
3. **Copiar el "Signing secret":**
   - Después de crear el webhook, copia el **"Signing secret"** (whsec_...)
   - Configúralo en Firebase Functions (Paso 3)

---

### **PASO 5: Desplegar Firebase Functions**

Después de configurar las claves, despliega las functions:

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions
npm install  # Si no lo has hecho
npm run build
firebase deploy --only functions
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Frontend:
- [ ] Archivo `.env` existe en la raíz del proyecto
- [ ] `REACT_APP_STRIPE_PUBLISHABLE_KEY` tiene tu clave pública (pk_test_...)
- [ ] `REACT_APP_API_URL` apunta a la URL correcta de Firebase Functions

### Backend (Firebase Functions):
- [ ] `STRIPE_SECRET_KEY` configurada en Firebase Secrets o Config
- [ ] `STRIPE_WEBHOOK_SECRET` configurada (opcional, para producción)
- [ ] Firebase Functions desplegadas

### Stripe Dashboard:
- [ ] Cuenta creada y verificada
- [ ] Claves API obtenidas (pk_test_ y sk_test_)
- [ ] Webhook configurado (opcional, para producción)

---

## 🧪 PROBAR LA CONFIGURACIÓN

1. **Reinicia tu servidor de desarrollo:**
   ```bash
   cd /Users/guillermohaya/Desktop/LUCA
   npm run dev
   ```

2. **Abre la consola del navegador** y verifica que veas:
   ```
   ✅ Stripe inicializado correctamente
   ```

3. **Intenta hacer un pago de prueba** usando una tarjeta de prueba:
   - **Número:** `4242 4242 4242 4242`
   - **CVV:** Cualquier 3 dígitos
   - **Fecha:** Cualquier fecha futura

---

## 📍 RESUMEN: DÓNDE VA CADA CLAVE

| Clave | Dónde va | Cómo configurarla |
|-------|----------|-------------------|
| **Publishable key** (pk_test_...) | Frontend | Archivo `.env` → `REACT_APP_STRIPE_PUBLISHABLE_KEY` |
| **Secret key** (sk_test_...) | Backend | Firebase Functions Secrets → `STRIPE_SECRET_KEY` |
| **Webhook secret** (whsec_...) | Backend | Firebase Functions Secrets → `STRIPE_WEBHOOK_SECRET` |

---

## ⚠️ IMPORTANTE

1. **NUNCA subas `.env` a Git** (ya está en `.gitignore`)
2. **Usa claves `pk_test_` y `sk_test_` para desarrollo**
3. **Cambia a `pk_live_` y `sk_live_` para producción** (cuando estés listo)
4. **Mantén las claves secretas seguras** - nunca las compartas públicamente

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Stripe no inicializado"
- Verifica que `REACT_APP_STRIPE_PUBLISHABLE_KEY` esté en `.env`
- Reinicia el servidor de desarrollo después de agregar la variable

### Error: "STRIPE_SECRET_KEY no configurada"
- Configura la clave usando `firebase functions:secrets:set STRIPE_SECRET_KEY`
- O usa `firebase functions:config:set stripe.secret_key="..."`

### Error al desplegar Functions
- Verifica que tengas Firebase CLI instalado: `firebase --version`
- Asegúrate de estar autenticado: `firebase login`
- Verifica el proyecto: `firebase use t4learningluca`

---

## 📚 RECURSOS

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)

---

**¿Tienes dudas?** Revisa los archivos de documentación:
- `GUIA_COMPLETA_CONFIGURACION_PAGOS.md`
- `PASO_A_PASO_CONFIGURACION.md`
- `CONFIGURACION_RAPIDA_HOY.md`

