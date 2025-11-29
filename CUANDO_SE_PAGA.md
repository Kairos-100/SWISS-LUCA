# 💳 CUÁNDO SE ACTIVA EL PAGO - Resumen Completo

---

## 📋 SITUACIONES EN LAS QUE SE DEBE PAGAR

### **1. 🛍️ PAGAR POR USAR UNA OFERTA (Payment Intent)**

**Cuándo:**
- Cuando el usuario hace clic en una oferta que tiene precio (`offer.price`)
- Cuando el usuario desliza (swipe) para activar una oferta con precio

**Dónde se activa:**
1. **En `handleOfferClick`** (línea 4679-4728):
   - Usuario hace clic en una oferta con precio
   - Calcula: `usagePrice = precioOferta * 5%` (OFFER_USAGE_PERCENTAGE = 0.05)
   - Abre modal de pago con `type: 'payment'`

2. **En `handleSlideToActivate`** (línea 1879-1915):
   - Usuario desliza para activar una oferta con precio
   - Calcula: `usagePrice = precioOferta * 5%`
   - Abre modal de pago antes de mostrar el countdown

**Cálculo del precio:**
```javascript
OFFER_USAGE_PERCENTAGE = 0.05  // 5% del coste de la oferta
usagePrice = offerPrice * 0.05

Ejemplo:
- Oferta: 20 CHF
- Precio a pagar: 20 * 0.05 = 1 CHF
```

**Después del pago exitoso:**
- Si fue swipe → Muestra countdown (timer)
- Si fue clic → Muestra detalles de la oferta
- Actualiza el perfil del usuario con el pago registrado

---

### **2. 💎 PAGAR POR FLASH DEAL**

**Cuándo:**
- Cuando el usuario hace clic en un Flash Deal que tiene precio

**Dónde se activa:**
- En `handleFlashDealClick` (línea 4650-4677):
  - Usuario hace clic en un Flash Deal
  - Si tiene precio, calcula: `usagePrice = precio * 5%`
  - Abre modal de pago

**Después del pago exitoso:**
- Activa el Flash Deal directamente
- Bloquea la oferta por 15 minutos
- Añade puntos al usuario
- Muestra notificación de éxito

---

### **3. 📅 SUSCRIPCIÓN MENSUAL/ANUAL (Subscription)**

**Cuándo:**
- Cuando el usuario quiere suscribirse a un plan
- Desde el `SubscriptionModal` (línea 2689-2908)

**Dónde se activa:**
- En `handleSubscribe` (línea 2716-2732):
  - Usuario selecciona un plan (mensual o anual)
  - Cierra el modal de suscripción
  - Abre modal de pago con `type: 'subscription'`

**Planes disponibles:**
```javascript
SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Plan Mensuel',
    price: 9.99,
    type: 'monthly'
  },
  {
    id: 'yearly',
    name: 'Plan Annuel',
    price: 99.99,
    type: 'yearly'
  }
]
```

**Después del pago exitoso:**
- Actualiza el perfil del usuario con la suscripción activa
- Recarga el perfil desde Firestore
- Muestra notificación: "Abonnement activé avec succès !"

---

## 🔄 FLUJO COMPLETO DE PAGO

### **Paso a Paso:**

```
1. Usuario realiza acción (clic/swipe/suscripción)
   ↓
2. Verifica si necesita pago
   - ¿Tiene precio? → SÍ → Calcula 5%
   - ¿Es suscripción? → SÍ → Calcula precio del plan
   ↓
3. Abre StripePaymentModal
   - Configura: type, amount, description, orderId
   - Guarda información pendiente en window.pendingOfferPayment
   ↓
4. Modal llama a Firebase Function
   - createPaymentIntent (pago único)
   - createSubscription (suscripción)
   ↓
5. Firebase Function crea PaymentIntent/Subscription en Stripe
   ↓
6. Retorna clientSecret
   ↓
7. Muestra formulario de Stripe
   - Usuario ingresa tarjeta/TWINT/Apple Pay
   ↓
8. Usuario confirma pago
   ↓
9. Pago procesado exitosamente
   ↓
10. onSuccess se ejecuta:
    - Actualiza perfil del usuario
    - Muestra countdown/detalles según el caso
    - Registra el pago en Firestore
    - Muestra notificación de éxito
```

---

## 💰 DETALLES DE PRECIOS

### **Pago por Oferta:**
- **Porcentaje:** 5% del precio de la oferta
- **Ejemplo:**
  - Oferta: 50 CHF → Pago: 2.50 CHF
  - Oferta: 100 CHF → Pago: 5 CHF

### **Suscripción:**
- **Mensual:** 9.99 CHF/mes
- **Anual:** 99.99 CHF/año

---

## 📍 UBICACIONES EN EL CÓDIGO

### **Configuración:**
- `OFFER_USAGE_PERCENTAGE = 0.05` (línea 120)
- `SUBSCRIPTION_PLANS` (definidos en el código)

### **Handlers de Pago:**
1. **handleOfferClick** (línea 4679) - Clic en oferta
2. **handleSlideToActivate** (línea 1879) - Swipe para activar
3. **handleFlashDealClick** (línea 4650) - Clic en Flash Deal
4. **handleSubscribe** (línea 2716) - Suscripción

### **Modal de Pago:**
- **StripePaymentModal** (línea 6410-6545)
- **onSuccess handler** (línea 6417-6535)

---

## ✅ RESUMEN

| Situación | Cuándo | Precio | Tipo |
|-----------|--------|--------|------|
| **Usar oferta con precio** | Clic o Swipe | 5% del precio | `payment` |
| **Flash Deal con precio** | Clic | 5% del precio | `payment` |
| **Suscripción mensual** | Desde SubscriptionModal | 9.99 CHF | `subscription` |
| **Suscripción anual** | Desde SubscriptionModal | 99.99 CHF | `subscription` |

---

**Todo está configurado y funcionando correctamente.** 🎉

Los pagos se activan automáticamente cuando el usuario intenta usar una oferta con precio o suscribirse.

