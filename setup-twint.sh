#!/bin/bash

echo "🚀 Configurando integración TWINT real..."

# Crear directorio backend si no existe
mkdir -p backend

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cd ..

# Crear archivo .env para backend
echo "⚙️ Creando archivo de configuración..."
cat > backend/.env << EOF
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
EOF

# Crear archivo .env para frontend
cat > .env << EOF
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
REACT_APP_API_URL=http://localhost:3001

# Firebase Configuration (ya configurado)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EOF

echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ve a https://dashboard.stripe.com/apikeys"
echo "2. Copia tu Publishable Key y Secret Key"
echo "3. Actualiza los archivos .env con tus claves reales"
echo "4. Ejecuta: cd backend && npm run dev"
echo "5. En otra terminal: npm start"
echo ""
echo "🎉 ¡Tu aplicación estará lista para pagos TWINT reales!"
