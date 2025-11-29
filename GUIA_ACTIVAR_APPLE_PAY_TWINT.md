# 🍎📱 Guía: Activar Apple Pay y TWINT en Stripe

## ✅ Estado del Código
Tu código **YA está configurado** para soportar Apple Pay y TWINT. Solo necesitas activarlos en Stripe Dashboard.

---

## 📋 PASO 1: Activar TWINT en Stripe

### 1.1 Acceder a Stripe Dashboard
1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Inicia sesión con tu cuenta

### 1.2 Activar TWINT
1. En el menú lateral, ve a **Settings** (⚙️)
2. Haz clic en **Payment methods** (o **Métodos de pago**)
3. Busca **TWINT** en la lista de métodos disponibles
4. Haz clic en el toggle para **activarlo** ✅
5. Configura los países permitidos:
   - Selecciona **Suiza (CH)** como país principal
   - Puedes agregar otros países si es necesario

### 1.3 Verificar Activación
- Deberías ver "TWINT" en la lista de métodos activos
- El estado debe mostrar "Active" o "Activo"

---

## 🍎 PASO 2: Activar Apple Pay en Stripe

### 2.1 Verificar Requisitos
Apple Pay se activa **automáticamente** si:
- ✅ Tu cuenta de Stripe está **verificada**
- ✅ Tienes un **dominio verificado** (para producción)
- ✅ Estás usando **HTTPS** (requerido para Apple Pay)

### 2.2 Para Desarrollo (Testing)
1. Ve a **Settings** → **Payment methods**
2. Busca **Apple Pay** en la lista
3. Si no aparece automáticamente:
   - Verifica que tu cuenta esté completamente verificada
   - Completa la información de negocio si falta

### 2.3 Para Producción
1. Ve a **Settings** → **Payment methods** → **Apple Pay**
2. Haz clic en **"Add domain"** o **"Agregar dominio"**
3. Ingresa tu dominio (ej: `tualmacen.com`)
4. Descarga el archivo de verificación que Stripe te proporciona
5. Sube el archivo a tu servidor en: `https://tualmacen.com/.well-known/apple-developer-merchantid-domain-association`
6. Verifica que el archivo sea accesible públicamente
7. Haz clic en **"Verify"** en Stripe Dashboard

### 2.4 Verificar Activación
- Apple Pay aparecerá automáticamente en dispositivos compatibles
- No necesitas hacer nada más en el código (ya está configurado)

---

## 🔧 PASO 3: Verificar Configuración en el Código

Tu código ya está configurado correctamente:

### En `functions/src/index.ts`:
```typescript
payment_method_types: ['card', 'twint', 'apple_pay'],
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'never',
},
```

### En `src/components/StripePaymentModal.tsx`:
- El modal muestra: "Sélectionnez votre mode de paiement (carte, TWINT ou Apple Pay)"
- Stripe Elements detecta automáticamente los métodos disponibles

---

## 🧪 PASO 4: Probar los Métodos

### Probar TWINT:
1. Usa una cuenta de prueba de Stripe
2. En el modal de pago, deberías ver la opción TWINT
3. Stripe proporciona datos de prueba para TWINT

### Probar Apple Pay:
1. **En iOS Simulator** (desarrollo):
   - Abre la app en el simulador
   - Apple Pay aparecerá automáticamente si está configurado
   - Usa tarjetas de prueba de Apple

2. **En dispositivo real** (producción):
   - Asegúrate de tener una tarjeta agregada en Apple Wallet
   - El botón de Apple Pay aparecerá automáticamente
   - Usa Touch ID o Face ID para confirmar

---

## ⚠️ IMPORTANTE: Requisitos Adicionales

### Para TWINT:
- ✅ Método activado en Stripe Dashboard
- ✅ País configurado (Suiza)
- ✅ Cuenta de Stripe verificada

### Para Apple Pay:
- ✅ Cuenta de Stripe verificada
- ✅ Dominio verificado (solo para producción)
- ✅ HTTPS habilitado (requerido)
- ✅ Certificado SSL válido

---

## 🚨 Solución de Problemas

### TWINT no aparece:
1. Verifica que esté activado en Stripe Dashboard
2. Asegúrate de estar en modo de prueba o producción según corresponda
3. Verifica que el país esté configurado correctamente

### Apple Pay no aparece:
1. **En desarrollo**: Verifica que estés usando HTTPS (localhost con SSL o ngrok)
2. **En producción**: Verifica que el dominio esté verificado
3. Verifica que tu cuenta de Stripe esté completamente verificada
4. Asegúrate de estar en un dispositivo compatible (iPhone, iPad, Mac con Touch ID)

### Métodos no aparecen en el modal:
1. Verifica las claves de Stripe (deben ser del mismo modo: test o live)
2. Verifica que las funciones de Firebase estén desplegadas
3. Revisa la consola del navegador para errores
4. Asegúrate de que `REACT_APP_STRIPE_PUBLISHABLE_KEY` esté configurada

---

## ✅ Checklist Final

- [ ] TWINT activado en Stripe Dashboard
- [ ] Apple Pay visible en Stripe Dashboard (o automático)
- [ ] Dominio verificado para Apple Pay (producción)
- [ ] Claves de Stripe configuradas en `.env`
- [ ] Firebase Functions desplegadas
- [ ] Probar en dispositivo/disimulador

---

## 🎯 Resumen

**Para activar Apple Pay y TWINT:**

1. **TWINT**: Actívalo manualmente en Stripe Dashboard → Settings → Payment methods
2. **Apple Pay**: Se activa automáticamente (solo verifica dominio en producción)
3. **Código**: Ya está configurado ✅
4. **Testing**: Usa las herramientas de prueba de Stripe

**¡Eso es todo!** Una vez activados en Stripe Dashboard, aparecerán automáticamente en tu aplicación.

---

## 📞 Soporte

Si tienes problemas:
- Consulta la [documentación de Stripe sobre TWINT](https://stripe.com/docs/payments/twint)
- Consulta la [documentación de Stripe sobre Apple Pay](https://stripe.com/docs/apple-pay)
- Revisa los logs de Firebase Functions para errores




