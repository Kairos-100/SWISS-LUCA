# 📋 PASO 1: Crear Cuenta en Stripe

## 🎯 **OBJETIVO:** Obtener las claves de API de Stripe

### **1.1 Crear cuenta (si no tienes una)**

1. **Abre tu navegador** y ve a:
   ```
   https://stripe.com
   ```

2. **Haz clic en "Start now"** o **"Sign up"**

3. **Completa el registro:**
   - Email
   - Contraseña
   - País: Suiza

4. **Verifica tu email** (revisa tu bandeja de entrada)

---

### **1.2 Obtener Claves API**

1. **Una vez dentro del Dashboard**, ve a:
   ```
   Developers → API Keys
   ```
   O directamente: https://dashboard.stripe.com/apikeys

2. **Verás dos claves en modo "Test":**

   **a) Publishable key** (pk_test_...)
   - ✅ Esta es la clave **pública**
   - ✅ Se puede ver directamente
   - ✅ **CÓPIALA** - la necesitarás para el archivo `.env`

   **b) Secret key** (sk_test_...)
   - ✅ Esta es la clave **secreta**
   - ✅ Haz clic en **"Reveal test key"** para verla
   - ✅ **CÓPIALA** - la necesitarás para Firebase Functions

3. **Guarda estas claves en un lugar seguro** (temporalmente)

---

### **✅ CUANDO TERMINES ESTE PASO:**

- [ ] Tienes cuenta en Stripe
- [ ] Tienes copiada la clave pública (pk_test_...)
- [ ] Tienes copiada la clave secreta (sk_test_...)

**👉 Cuando tengas las claves, avísame y continuamos con el Paso 2**




