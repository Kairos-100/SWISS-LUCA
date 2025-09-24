#!/bin/bash

echo "🚀 Configurando TWINT REAL para FLASH..."

# Crear archivo .env para frontend
echo "⚙️ Creando archivo de configuración frontend..."
cat > .env << EOF
# TWINT Configuration
REACT_APP_TWINT_API_URL=https://api.datatrans.com
REACT_APP_TWINT_MERCHANT_ID=tu_merchant_id_aqui
REACT_APP_TWINT_API_KEY=tu_api_key_aqui

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
echo "📋 Próximos pasos para TWINT REAL:"
echo ""
echo "1. 🏢 ELEGIR PLATAFORMA:"
echo "   - Datatrans (recomendado): https://datatrans.ch"
echo "   - TWINT Business: https://business.twint.ch"
echo "   - Worldline: https://worldline.com"
echo ""
echo "2. 🔑 OBTENER CREDENCIALES:"
echo "   - Regístrate en la plataforma elegida"
echo "   - Completa la verificación"
echo "   - Recibe Merchant ID y API Key"
echo ""
echo "3. ⚙️ CONFIGURAR:"
echo "   - Edita el archivo .env"
echo "   - Reemplaza 'tu_merchant_id_aqui' con tu Merchant ID real"
echo "   - Reemplaza 'tu_api_key_aqui' con tu API Key real"
echo ""
echo "4. 🚀 EJECUTAR:"
echo "   - npm start"
echo "   - Prueba el pago TWINT"
echo ""
echo "5. 💳 COSTOS:"
echo "   - Datatrans: 1.4% + 0.25 CHF por transacción"
echo "   - TWINT Business: 0.8% + 0.10 CHF por transacción"
echo "   - Worldline: 1.2% + 0.20 CHF por transacción"
echo ""
echo "🎉 ¡Tu aplicación estará lista para pagos TWINT reales!"
echo ""
echo "📞 Soporte:"
echo "   - Datatrans: https://datatrans.ch/support"
echo "   - TWINT Business: https://business.twint.ch/support"
echo "   - Worldline: https://worldline.com/support"
