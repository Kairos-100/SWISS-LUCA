# 🔐 Configurar Clave Secreta de Stripe en Firebase Functions

## ✅ Clave Pública ya configurada

Tu clave pública de Stripe ya está configurada en `.env`:
- ✅ `pk_live_51SVvzBEMR4BkmH4Z9rtFCTGG6RpULUs4fKr5Ym7IMi2KIVCSJY74JlIWaM2X5KY4KEx2mVL1rSo7tp24D6KAtk7j00U6GQOIvJ`

---

## 🔑 PASO FINAL: Configurar Clave Secreta

### 1. Obtener tu Clave Secreta de Stripe

1. Ve a: https://dashboard.stripe.com/apikeys
2. Busca la sección **"Secret key"** 
3. Haz clic en **"Reveal live key"** o **"Reveal test key"**
4. Copia la clave (debería empezar con `sk_live_...` o `sk_test_...`)

⚠️ **IMPORTANTE:** Como usas una clave pública de producción (`pk_live_...`), necesitas la clave secreta de producción correspondiente (`sk_live_...`)

---

### 2. Configurar en Firebase Functions

Ejecuta estos comandos en tu terminal:

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions

# Opción A: Usando Firebase Secrets (Recomendado - Más Seguro)
firebase functions:secrets:set STRIPE_SECRET_KEY
# Cuando te pregunte, pega tu clave secreta (sk_live_...)

# O Opción B: Usando Firebase Config (Alternativa)
firebase functions:config:set stripe.secret_key="sk_live_TU_CLAVE_SECRETA_AQUI"
```

---

### 3. Desplegar Firebase Functions

Después de configurar la clave secreta, despliega las functions:

```bash
cd /Users/guillermohaya/Desktop/LUCA/functions
npm run build
firebase deploy --only functions
```

---

## 📋 Resumen de Configuración

| Clave | Estado | Dónde está |
|-------|--------|------------|
| **Publishable Key** | ✅ Configurada | Archivo `.env` → `REACT_APP_STRIPE_PUBLISHABLE_KEY` |
| **Secret Key** | ⚠️ Falta configurar | Firebase Functions Secrets → `STRIPE_SECRET_KEY` |

---

## ⚠️ Recordatorios Importantes

1. **Modo Producción:** Estás usando claves de producción (`pk_live_` y `sk_live_`), por lo que:
   - Los pagos serán **REALES**
   - El dinero se transferirá realmente
   - Asegúrate de que tu cuenta de Stripe esté completamente verificada

2. **Seguridad:**
   - ✅ Nunca compartas la clave secreta públicamente
   - ✅ No subas la clave secreta a Git (ya está protegida)
   - ✅ Usa Firebase Secrets para almacenarla de forma segura

3. **Para Desarrollo/Pruebas:**
   - Si quieres hacer pruebas, puedes cambiar a claves de prueba (`pk_test_` y `sk_test_`)
   - Cambia `REACT_APP_PAYMENT_TEST_MODE=true` en `.env`

---

## 🧪 Verificar que Todo Funcione

1. **Reinicia tu servidor de desarrollo:**
   ```bash
   cd /Users/guillermohaya/Desktop/LUCA
   npm run dev
   ```

2. **Abre la consola del navegador** y verifica que veas:
   ```
   ✅ Stripe inicializado correctamente
   ```

3. **Intenta hacer un pago de prueba:**
   - Abre el modal de pago en tu aplicación
   - Deberías ver el formulario de Stripe

---

## 🆘 Si Tienes Problemas

### Error: "Stripe no inicializado"
- Verifica que el servidor se haya reiniciado después de cambiar `.env`
- Verifica que la clave pública esté correctamente en `.env`

### Error: "STRIPE_SECRET_KEY no configurada"
- Asegúrate de haber configurado la clave secreta en Firebase
- Verifica que hayas desplegado las functions después de configurar

---

**¿Necesitas ayuda?** Puedo guiarte paso a paso para configurar la clave secreta.

