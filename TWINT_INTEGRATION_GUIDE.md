# 🚀 Guía de Integración TWINT Real

Esta guía te ayudará a integrar TWINT de verdad en tu aplicación FLASH usando Stripe como proveedor de servicios de pago.

## 📋 **Prerequisitos**

1. **Cuenta de Stripe** (gratuita para testing)
2. **Cuenta de TWINT Business** (opcional para testing)
3. **Node.js** (v16 o superior)
4. **npm** o **yarn**

## 🔧 **Configuración Paso a Paso**

### **1. Configurar Stripe**

1. **Crear cuenta en Stripe:**
   - Ve a [stripe.com](https://stripe.com)
   - Regístrate con tu email
   - Completa la verificación de identidad

2. **Obtener claves API:**
   - Ve a [Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
   - Copia tu **Publishable Key** (pk_test_...)
   - Copia tu **Secret Key** (sk_test_...)

3. **Habilitar TWINT:**
   - Ve a [Dashboard > Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
   - Busca "TWINT" y actívalo
   - Configura los países (Suiza)

### **2. Configurar Variables de Entorno**

**Frontend (.env):**
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_aqui
REACT_APP_API_URL=http://localhost:3001
```

**Backend (backend/.env):**
```bash
STRIPE_SECRET_KEY=sk_test_tu_clave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_aqui
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### **3. Instalar Dependencias**

**Backend:**
```bash
cd backend
npm install
```

**Frontend (ya instalado):**
```bash
npm install @stripe/stripe-js
```

### **4. Ejecutar la Aplicación**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

## 🧪 **Testing**

### **Modo Desarrollo**
- La aplicación usa datos simulados
- No se procesan pagos reales
- Perfecto para desarrollo y testing

### **Modo Producción**
- Cambia `NODE_ENV=production` en backend
- Usa claves de producción de Stripe
- Procesa pagos reales

### **Datos de Prueba TWINT**
Stripe proporciona datos de prueba específicos para TWINT:
- **Número de teléfono:** +41 79 123 45 67
- **Código de verificación:** 123456

## 🌍 **Despliegue en Producción**

### **1. Backend (Heroku, Vercel, Railway)**

**Heroku:**
```bash
# Instalar Heroku CLI
heroku create flash-backend
heroku config:set STRIPE_SECRET_KEY=sk_live_tu_clave
heroku config:set FRONTEND_URL=https://tu-app.com
git push heroku main
```

**Vercel:**
```bash
# Instalar Vercel CLI
vercel --prod
# Configurar variables de entorno en dashboard
```

### **2. Frontend (Netlify, Vercel, Firebase)**

**Firebase Hosting:**
```bash
firebase deploy --only hosting
```

### **3. Configurar Webhooks (Opcional)**

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Crea un nuevo endpoint: `https://tu-backend.com/api/webhook`
3. Selecciona eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copia el **Webhook Secret** a tu `.env`

## 💳 **Flujo de Pago TWINT**

1. **Usuario selecciona suscripción**
2. **Hace clic en "Payer avec TWINT"**
3. **Se abre modal con Stripe Elements**
4. **Usuario configura método TWINT**
5. **Confirma pago**
6. **Stripe procesa con TWINT**
7. **Suscripción se activa automáticamente**

## 🔒 **Seguridad**

- ✅ **HTTPS obligatorio** en producción
- ✅ **Validación de datos** en backend
- ✅ **CORS configurado** correctamente
- ✅ **Helmet** para headers de seguridad
- ✅ **Variables de entorno** para claves sensibles

## 📊 **Monitoreo**

### **Stripe Dashboard**
- Ver transacciones en tiempo real
- Monitorear fallos de pago
- Análisis de conversión

### **Logs de Aplicación**
- Backend: `console.log` en servidor
- Frontend: `console.error` en navegador

## 🆘 **Solución de Problemas**

### **Error: "Stripe not initialized"**
- Verifica que `REACT_APP_STRIPE_PUBLISHABLE_KEY` esté configurado
- Asegúrate de que la clave empiece con `pk_test_` o `pk_live_`

### **Error: "Payment method not available"**
- Verifica que TWINT esté habilitado en tu cuenta Stripe
- Confirma que estés en modo test/producción correcto

### **Error: "CORS"**
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que el backend esté ejecutándose

### **Error: "Webhook signature verification failed"**
- Verifica que `STRIPE_WEBHOOK_SECRET` esté correcto
- Asegúrate de que el endpoint webhook sea accesible

## 📞 **Soporte**

- **Stripe Support:** [support.stripe.com](https://support.stripe.com)
- **TWINT Support:** [twint.ch/support](https://twint.ch/support)
- **Documentación Stripe:** [stripe.com/docs](https://stripe.com/docs)

## 🎉 **¡Listo!**

Tu aplicación FLASH ahora puede procesar pagos reales con TWINT. Los usuarios suizos podrán pagar sus suscripciones de forma rápida y segura usando su app TWINT favorita.

### **Próximos Pasos:**
1. Configura las variables de entorno
2. Ejecuta el backend y frontend
3. Prueba con datos de prueba de Stripe
4. Despliega en producción
5. ¡Disfruta de los pagos TWINT! 🚀
