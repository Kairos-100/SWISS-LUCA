# ✅ CONFIGURACIÓN: Pago Mensual para Suscripciones

**Fecha:** $(date +"%Y-%m-%d %H:%M:%S")

---

## ✅ CAMBIO REALIZADO

### **Antes (Incorrecto):**
- Plan Mensual: 9.99 CHF/mes ✅
- Plan Anual: 99.99 CHF/año (pago único anual) ❌

### **Ahora (Correcto):**
- Plan Mensual: 9.99 CHF/mes ✅
- Plan Anual: 8.33 CHF/mes (pago mensual durante 12 meses) ✅

---

## 💰 PRECIOS ACTUALIZADOS

| Plan | Precio Mensual | Duración | Total |
|------|----------------|-----------|-------|
| **Mensual** | 9.99 CHF | 1 mes | 9.99 CHF |
| **Anual** | 8.33 CHF | 12 meses | 99.99 CHF total |

---

## 📍 CAMBIOS EN EL CÓDIGO

### 1. **Frontend (`src/App.tsx`):**

**Línea 100-117:**
```javascript
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Plan Mensuel',
    price: 9.99,
    duration: 30,
    type: 'monthly',
    features: ['Accès complet à l\'app', 'Offres illimitées', 'Support prioritaire']
  },
  {
    id: 'yearly',
    name: 'Plan Annuel',
    price: 8.33, // Precio mensual del plan anual (99.99 / 12 meses)
    duration: 365,
    type: 'yearly',
    features: ['Accès complet à l\'app', 'Offres illimitées', 'Support prioritaire', 'Économie: 1.66 CHF/mois']
  }
];
```

**Línea 2839:**
```javascript
par mois {plan.type === 'yearly' && '(plan annuel - 12 mois)'}
```

---

### 2. **Backend (`functions/src/index.ts`):**

**Línea 167-189:**
```typescript
// Determinar precio según plan
// IMPORTANTE: Ambos planes se pagan mensualmente
const prices: Record<string, { monthly: number; yearly: number }> = {
  standard: {
    monthly: 9.99,  // Plan mensual: 9.99 CHF/mes
    yearly: 8.33,   // Plan anual: 8.33 CHF/mes (99.99 / 12 meses)
  },
};

const planPrices = prices.standard || { monthly: 9.99, yearly: 8.33 };
const price = planType === 'monthly' 
  ? planPrices.monthly 
  : planPrices.yearly;

// Crear precio en Stripe primero
// AMBOS planes se pagan mensualmente (interval: 'month')
const priceObj = await stripe.prices.create({
  currency: 'chf',
  unit_amount: Math.round(price * 100),
  recurring: {
    interval: 'month', // Ambos planes se pagan mensualmente
  },
  product_data: {
    name: `LUCA App - ${planType === 'monthly' ? 'Plan Mensuel' : 'Plan Annuel'}`,
    description: planType === 'yearly' 
      ? 'Plan anual con pago mensual (12 meses)' 
      : 'Plan mensual',
  },
});
```

---

## 🎯 COMPORTAMIENTO

### **Plan Mensual:**
- Pago: 9.99 CHF cada mes
- Renovación: Automática cada mes
- Cancelación: En cualquier momento

### **Plan Anual:**
- Pago: 8.33 CHF cada mes durante 12 meses
- Renovación: Automática cada mes
- Duración total: 12 meses
- Ahorro: 1.66 CHF/mes comparado con el plan mensual
- Cancelación: En cualquier momento

---

## 📊 CÁLCULO DEL PRECIO ANUAL

```
Precio anual total: 99.99 CHF
Dividido en 12 meses: 99.99 / 12 = 8.33 CHF/mes
```

---

## ✅ RESUMEN

| Aspecto | Estado |
|---------|--------|
| **Plan Mensual** | ✅ 9.99 CHF/mes |
| **Plan Anual** | ✅ 8.33 CHF/mes (12 meses) |
| **Intervalo Stripe** | ✅ 'month' para ambos planes |
| **Textos UI** | ✅ Actualizados |
| **Backend** | ✅ Configurado correctamente |

---

**Todo está configurado. Ambos planes se pagan mensualmente.** ✅

