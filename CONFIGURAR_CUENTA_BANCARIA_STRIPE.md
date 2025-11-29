# 💰 Configurar Cuenta Bancaria para Recibir Pagos en Stripe

## 🎯 Objetivo
Conectar tu cuenta bancaria con Stripe para recibir los pagos de tus clientes automáticamente.

---

## 📋 PASO 1: Completar Información de Negocio en Stripe

### 1.1 Acceder a Stripe Dashboard
1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Inicia sesión con tu cuenta

### 1.2 Completar Perfil de Negocio
1. Ve a **Settings** → **Business settings** (o **Configuración del negocio**)
2. Completa toda la información requerida:

#### Información Básica:
- ✅ **Nombre del negocio** (ej: "LUCA App")
- ✅ **Tipo de negocio** (Individual, Empresa, Organización sin fines de lucro)
- ✅ **País** (Suiza - CH)
- ✅ **Dirección completa**
- ✅ **Número de teléfono**

#### Información Fiscal:
- ✅ **Número de identificación fiscal** (si aplica)
- ✅ **Código postal**
- ✅ **Ciudad**

#### Información de Contacto:
- ✅ **Email de contacto**
- ✅ **Sitio web** (si tienes)

---

## 🏦 PASO 2: Agregar Cuenta Bancaria

### 2.1 Acceder a Configuración de Pagos
1. Ve a **Settings** → **Payouts** (o **Pagos**)
2. Haz clic en **"Add bank account"** o **"Agregar cuenta bancaria"**

### 2.2 Información Requerida

#### Para Cuentas en Suiza (CHF):
Necesitarás:
- ✅ **IBAN** (International Bank Account Number)
- ✅ **Nombre del titular de la cuenta**
- ✅ **Dirección del titular**
- ✅ **Código SWIFT/BIC** (si es necesario)

#### Ejemplo de IBAN Suizo:
```
CH93 0076 2011 6238 5295 7
```

### 2.3 Pasos para Agregar:
1. Selecciona el **país** (Suiza)
2. Selecciona el **tipo de cuenta** (Corriente o Ahorros)
3. Ingresa el **IBAN** de tu cuenta
4. Ingresa el **nombre del titular** (debe coincidir con el nombre en Stripe)
5. Verifica la información
6. Haz clic en **"Add bank account"**

---

## ✅ PASO 3: Verificar Identidad (KYC)

### 3.1 Verificación Requerida
Stripe requiere verificar tu identidad para activar los pagos. Ve a:

**Settings** → **Verification** (o **Verificación**)

### 3.2 Documentos Necesarios:

#### Para Personas Individuales:
- ✅ **Pasaporte** o **Documento de identidad nacional**
- ✅ **Comprobante de domicilio** (factura de servicios, extracto bancario)
- ✅ **Selfie** (foto tuya sosteniendo el documento)

#### Para Empresas:
- ✅ **Documentos de registro de la empresa**
- ✅ **Identificación del representante legal**
- ✅ **Comprobante de domicilio de la empresa**
- ✅ **Información de los accionistas** (si aplica)

### 3.3 Proceso:
1. Sube los documentos requeridos
2. Espera la verificación (puede tardar 1-3 días hábiles)
3. Stripe te notificará por email cuando esté verificado

---

## 💸 PASO 4: Configurar Transferencias Automáticas

### 4.1 Configuración de Payouts
1. Ve a **Settings** → **Payouts**
2. Configura las opciones:

#### Frecuencia de Transferencias:
- **Diaria**: Recibes pagos cada día (recomendado)
- **Semanal**: Recibes pagos una vez por semana
- **Mensual**: Recibes pagos una vez al mes

#### Moneda:
- Selecciona **CHF** (Francos Suizos)

#### Método:
- **Automático**: Stripe transfiere automáticamente
- **Manual**: Tú decides cuándo transferir

### 4.2 Recomendación:
✅ **Configura transferencias diarias automáticas** para recibir el dinero rápidamente.

---

## 🔒 PASO 5: Configurar Webhooks (Opcional pero Recomendado)

### 5.1 ¿Qué son los Webhooks?
Los webhooks notifican a tu aplicación cuando:
- Un pago se completa
- Una transferencia se realiza
- Hay un problema con un pago

### 5.2 Configurar Webhook:
1. Ve a **Developers** → **Webhooks**
2. Haz clic en **"Add endpoint"**
3. Ingresa la URL de tu webhook:
   ```
   https://europe-west1-t4learningluca.cloudfunctions.net/stripeWebhook
   ```
4. Selecciona los eventos a escuchar:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.succeeded`
   - ✅ `payout.paid`
5. Copia el **Webhook Secret** (whsec_...)
6. Configúralo en Firebase Functions:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_tu_secret_aqui"
   ```

---

## 📊 PASO 6: Verificar Configuración

### Checklist Final:
- [ ] Información de negocio completa
- [ ] Cuenta bancaria agregada y verificada
- [ ] Identidad verificada (KYC)
- [ ] Transferencias automáticas configuradas
- [ ] Webhook configurado (opcional)
- [ ] Claves de API configuradas en tu app

---

## 🧪 PASO 7: Probar con Pagos de Prueba

### 7.1 Modo de Prueba (Test Mode):
1. Asegúrate de estar en **Test Mode** en Stripe Dashboard
2. Usa tarjetas de prueba para hacer pagos
3. Verifica que los pagos aparezcan en el dashboard
4. **Nota**: En modo de prueba, NO se transfieren fondos reales

### 7.2 Modo de Producción (Live Mode):
1. Cambia a **Live Mode** cuando estés listo
2. Usa claves de producción (`pk_live_` y `sk_live_`)
3. Los pagos reales se transferirán a tu cuenta bancaria

---

## 💡 Información Importante

### Tiempos de Transferencia:
- **Suiza (CHF)**: 1-2 días hábiles
- **Primera transferencia**: Puede tardar hasta 7 días hábiles
- **Transferencias siguientes**: Según la frecuencia configurada

### Comisiones de Stripe:
- **Tarjetas**: 1.4% + CHF 0.25 por transacción (Suiza)
- **TWINT**: 1.4% + CHF 0.25 por transacción
- **Apple Pay**: Misma comisión que tarjetas
- **Sin comisión mensual** (solo por transacción)

### Límites:
- **Verificación pendiente**: Puede haber límites temporales
- **Después de verificación**: Sin límites (según tu plan)

---

## 🚨 Solución de Problemas

### La cuenta bancaria no se agrega:
- Verifica que el IBAN sea correcto
- Asegúrate de que el nombre coincida con Stripe
- Verifica que el banco esté en la lista de bancos soportados

### Los pagos no se transfieren:
- Verifica que la cuenta esté verificada
- Revisa que la identidad esté verificada (KYC)
- Verifica la configuración de transferencias automáticas
- Revisa los logs en Stripe Dashboard → Payouts

### Error de verificación:
- Asegúrate de que los documentos sean claros y legibles
- Verifica que la información coincida con tu perfil
- Contacta al soporte de Stripe si persiste

---

## 📞 Soporte de Stripe

Si tienes problemas:
- **Email**: support@stripe.com
- **Chat**: Disponible en el Dashboard
- **Documentación**: [https://stripe.com/docs](https://stripe.com/docs)

---

## ✅ Resumen Rápido

1. **Completa tu perfil de negocio** en Stripe Dashboard
2. **Agrega tu cuenta bancaria** (IBAN suizo)
3. **Verifica tu identidad** (sube documentos)
4. **Configura transferencias automáticas** (diarias recomendadas)
5. **Prueba con pagos de prueba** antes de producción
6. **Cambia a modo Live** cuando estés listo

**¡Una vez completado, recibirás los pagos automáticamente en tu cuenta bancaria!** 🎉




