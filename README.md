# ⚡ LUCA - App de Ofertas Flash

<div align="center">
  
  ![LUCA App](https://img.shields.io/badge/LUCA-v1.0.0-gold?style=for-the-badge)
  ![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)
  ![Firebase](https://img.shields.io/badge/Firebase-11.10-FFCA28?style=for-the-badge&logo=firebase)
  ![Stripe](https://img.shields.io/badge/Stripe-Pagos-635BFF?style=for-the-badge&logo=stripe)

  **Aplicación profesional de ofertas y descuentos en tiempo real para Suiza** 🇨🇭

  [Documentación](#-documentación) •
  [Instalación](#-instalación) •
  [Características](#-características) •
  [Tecnologías](#-tecnologías-utilizadas) •
  [Despliegue](#-despliegue)

</div>

---

## 📋 Descripción

**LUCA** es una aplicación web moderna para descubrir y activar ofertas exclusivas en comercios locales de Suiza. Los usuarios pueden ver ofertas en tiempo real, activarlas con un simple deslizamiento, y ahorrar dinero en sus compras diarias.

### 🎯 Características Principales

- ⚡ **Ofertas Flash**: Descuentos por tiempo limitado
- 🗺️ **Vista de Mapa**: Localiza ofertas cercanas con Google Maps
- 📱 **Responsive**: Funciona en móvil, tablet y desktop
- 🌍 **Multiidioma**: Francés, Inglés y Coreano
- 💳 **Pagos con TWINT**: Método de pago suizo integrado
- 🔐 **Autenticación Segura**: Login con email o Google
- 📊 **Gamificación**: Sistema de puntos y niveles
- ⏱️ **Sistema de Bloqueo**: Previene abuso de ofertas

---

## 📚 DOCUMENTACIÓN

### 📖 Guías Disponibles

1. **[RESUMEN_FINAL.md](./RESUMEN_FINAL.md)** - ⭐ **LEER PRIMERO**
   - Estado actual del proyecto
   - Qué funciona y qué no
   - Próximos pasos
   - Respuestas a preguntas frecuentes

2. **[INFORME_REVISION_COMPLETA.md](./INFORME_REVISION_COMPLETA.md)**
   - Análisis técnico detallado
   - Problemas encontrados y soluciones
   - Arquitectura del sistema
   - Plan de acción completo

3. **[GUIA_IMPLEMENTACION_PAGOS.md](./GUIA_IMPLEMENTACION_PAGOS.md)** - 💳 **PARA CONFIGURAR PAGOS**
   - Configuración paso a paso de Stripe
   - Despliegue de backend
   - Despliegue de Firebase Functions
   - Testing y producción

4. **[AUTHENTICATION_TROUBLESHOOTING.md](./AUTHENTICATION_TROUBLESHOOTING.md)**
   - Solución de problemas de autenticación
   - Configuración de Firebase Auth
   - Errores comunes

---

## 🚀 Instalación Rápida

### Prerrequisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Firebase CLI
```

### 1. Clonar e Instalar

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/luca-app.git
cd luca-app

# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..

# Instalar dependencias de Firebase Functions
cd functions
npm install
cd ..
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

Ver [GUIA_IMPLEMENTACION_PAGOS.md](./GUIA_IMPLEMENTACION_PAGOS.md) para más detalles.

### 3. Ejecutar en Desarrollo

```bash
# Frontend
npm run dev

# Backend (en otra terminal)
cd backend
npm start

# Firebase Functions (opcional, para testing local)
cd functions
npm run serve
```

Abrir http://localhost:3000

---

## ✨ Características

### 🎨 Interfaz de Usuario
- ✅ Diseño moderno con Material-UI
- ✅ Tema personalizado profesional
- ✅ Animaciones suaves y transiciones
- ✅ Modo responsive para todos los dispositivos
- ✅ Sistema de notificaciones toast

### 👤 Gestión de Usuarios
- ✅ Registro con email/password
- ✅ Login con Google
- ✅ Recuperación de contraseña
- ✅ Perfiles completamente separados por usuario
- ✅ Historial de ofertas activadas
- ✅ Sistema de puntos y niveles

### 🎁 Sistema de Ofertas
- ✅ Ofertas regulares por categorías
- ✅ Ofertas flash con tiempo límite
- ✅ Filtros por categoría y subcategoría
- ✅ Vista de lista y mapa
- ✅ Cálculo de distancia en tiempo real
- ✅ Sistema de bloqueo temporal (10 min antes + 15 min después)
- ✅ Persistencia en localStorage

### 💰 Sistema de Pagos
- ✅ Integración con Stripe
- ✅ Soporte para TWINT (método suizo)
- ✅ Suscripciones mensuales y anuales
- ✅ Período de prueba gratuito
- ✅ Renovación automática
- ✅ Webhooks para actualizaciones automáticas
- ✅ Gestión de pagos fallidos

### 🌍 Internacionalización
- ✅ Francés (idioma principal)
- ✅ Inglés
- ✅ Coreano
- ✅ Selector de idioma persistente
- ✅ Traducciones completas

### 🗺️ Mapa Interactivo
- ✅ Integración con Google Maps
- ✅ Marcadores personalizados por categoría
- ✅ InfoWindows con información detallada
- ✅ Geolocalización del usuario
- ✅ Cálculo de distancia

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19** - Framework de UI
- **TypeScript 5.8** - Tipado estático
- **Material-UI 7** - Componentes de UI
- **Vite** - Build tool
- **i18next** - Internacionalización
- **Google Maps API** - Mapas interactivos

### Backend
- **Express.js** - Servidor HTTP
- **Stripe** - Procesamiento de pagos
- **Node.js** - Runtime

### Base de Datos & Auth
- **Firebase Auth** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL
- **Firebase Functions** - Funciones serverless
- **Firebase Hosting** - Hosting de la app

### Pagos
- **Stripe** - Plataforma de pagos
- **TWINT** - Método de pago suizo

---

## 📁 Estructura del Proyecto

```
LUCA/
├── src/                          # Código fuente del frontend
│   ├── components/               # Componentes React
│   │   ├── FlashDealsWithBlocking.tsx
│   │   ├── SubscriptionWidget.tsx
│   │   ├── TwintPaymentModal.tsx
│   │   └── ...
│   ├── services/                 # Servicios
│   │   └── paymentService.ts    # ⭐ Servicio unificado de pagos
│   ├── hooks/                    # Custom hooks
│   │   ├── useBlockedOffers.ts
│   │   └── useTimer.ts
│   ├── types/                    # Definiciones de tipos
│   │   └── index.ts
│   ├── utils/                    # Utilidades
│   ├── theme/                    # Tema de Material-UI
│   ├── i18n.ts                   # Configuración de idiomas
│   ├── firebase.ts               # Configuración de Firebase
│   └── App.tsx                   # Componente principal
│
├── backend/                      # Backend Express
│   ├── server.js                 # Servidor Express
│   ├── package.json
│   └── .env.example
│
├── functions/                    # Firebase Functions
│   ├── src/
│   │   └── index.ts             # ⭐ Functions implementadas
│   ├── package.json
│   └── tsconfig.json
│
├── public/                       # Archivos públicos
├── dist/                         # Build de producción
│
├── firestore.rules              # Reglas de seguridad de Firestore
├── firebase.json                # Configuración de Firebase
├── capacitor.config.ts          # Configuración de Capacitor (móvil)
│
├── .env.example                 # ⭐ Variables de entorno (plantilla)
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── README.md                    # ⭐ Este archivo
├── RESUMEN_FINAL.md            # ⭐ Resumen ejecutivo
├── INFORME_REVISION_COMPLETA.md # ⭐ Análisis técnico
└── GUIA_IMPLEMENTACION_PAGOS.md # ⭐ Guía de implementación
```

---

## 🔐 Seguridad

### Reglas de Firestore

```javascript
rules_version='2'
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo el usuario puede acceder a sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Variables de Entorno

⚠️ **NUNCA** subir el archivo `.env` a Git

```bash
# Archivos protegidos en .gitignore:
.env
.env.local
.env.production
backend/.env
```

---

## 📊 Estado del Proyecto

### ✅ Completado (95%)

- [x] Frontend completo
- [x] Sistema de autenticación
- [x] Sistema de ofertas
- [x] Sistema de ofertas flash
- [x] Sistema de bloqueos
- [x] Perfil de usuario
- [x] Interfaz de suscripciones
- [x] Integración con Google Maps
- [x] Internacionalización
- [x] Backend implementado
- [x] Firebase Functions implementadas
- [x] Servicio de pagos unificado

### ⚠️ Pendiente (5%)

- [ ] Configurar credenciales de Stripe
- [ ] Desplegar backend a producción
- [ ] Desplegar Firebase Functions
- [ ] Configurar webhooks de Stripe
- [ ] Testing de pagos en producción

---

## 🚀 Despliegue

### Frontend (Firebase Hosting)

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Backend (Railway/Heroku)

Ver [GUIA_IMPLEMENTACION_PAGOS.md](./GUIA_IMPLEMENTACION_PAGOS.md) para instrucciones detalladas.

### Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 🧪 Testing

### Cuentas de Prueba

**Usuario de prueba:**
- Email: `test@example.com`
- Password: `Test123!`

**Tarjetas de prueba de Stripe:**
```
Tarjeta válida:     4242 4242 4242 4242
Tarjeta rechazada:  4000 0000 0000 0002
Requiere auth 3D:   4000 0027 6000 3184
```

### Ejecutar Tests

```bash
# Frontend
npm test

# Backend
cd backend
npm test
```

---

## 📱 Aplicación Móvil (Capacitor)

### Android

```bash
npm run build
npx cap sync android
npx cap open android
```

### iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

---

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Stripe publishable key no configurada"
```bash
# Verificar que .env existe y tiene la clave correcta
cat .env | grep STRIPE
```

#### Error: "Firebase Functions not found"
```bash
# Redesplegar functions
firebase deploy --only functions
```

#### Error: "CORS blocked"
```bash
# Verificar configuración de CORS en backend/server.js
```

Ver [AUTHENTICATION_TROUBLESHOOTING.md](./AUTHENTICATION_TROUBLESHOOTING.md) para más soluciones.

---

## 📈 Roadmap

### v1.1 (Próximamente)
- [ ] Panel de administración para comercios
- [ ] Sistema de notificaciones push
- [ ] Chat de soporte en vivo
- [ ] Sistema de referidos

### v1.2 (Futuro)
- [ ] Integración con más métodos de pago
- [ ] Sistema de reseñas
- [ ] Programa de fidelización avanzado
- [ ] App móvil nativa

---

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 📞 Contacto

**Proyecto:** LUCA App  
**Firebase Project:** t4learningluca

---

## 🙏 Agradecimientos

- Material-UI por los componentes
- Firebase por la infraestructura
- Stripe por el procesamiento de pagos
- Google Maps por la API de mapas

---

## 📚 Documentación Adicional

- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)

---

<div align="center">

**⚡ Hecho con ❤️ para la comunidad suiza 🇨🇭**

[⬆ Volver arriba](#-luca---app-de-ofertas-flash)

</div>
