#!/bin/bash
# Script de configuración rápida - LUCA App

echo "🚀 CONFIGURACIÓN RÁPIDA DE PAGOS - LUCA APP"
echo "============================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PASO 1: Configurar archivo .env${NC}"
echo "Edita el archivo .env y agrega tu clave pública de Stripe"
echo "Archivo: /Users/guillermohaya/Desktop/LUCA/.env"
echo ""
read -p "¿Ya tienes tu clave pública de Stripe? (pk_test_...) [s/n]: " tiene_clave

if [ "$tiene_clave" = "s" ] || [ "$tiene_clave" = "S" ]; then
    read -p "Pega tu clave pública (pk_test_...): " stripe_key
    cd /Users/guillermohaya/Desktop/LUCA
    sed -i '' "s/pk_test_TU_CLAVE_AQUI/$stripe_key/" .env
    echo -e "${GREEN}✅ Clave pública configurada en .env${NC}"
else
    echo "Primero obtén tu clave en: https://dashboard.stripe.com/apikeys"
fi

echo ""
echo -e "${YELLOW}PASO 2: Configurar Firebase Functions${NC}"
read -p "¿Tienes tu clave secreta de Stripe? (sk_test_...) [s/n]: " tiene_secret

if [ "$tiene_secret" = "s" ] || [ "$tiene_secret" = "S" ]; then
    read -p "Pega tu clave secreta (sk_test_...): " stripe_secret
    cd /Users/guillermohaya/Desktop/LUCA/functions
    firebase functions:config:set stripe.secret_key="$stripe_secret"
    echo -e "${GREEN}✅ Clave secreta configurada${NC}"
else
    echo "Obtén tu clave secreta en: https://dashboard.stripe.com/apikeys"
fi

echo ""
echo -e "${YELLOW}PASO 3: Desplegar Firebase Functions${NC}"
read -p "¿Quieres desplegar las funciones ahora? [s/n]: " desplegar

if [ "$desplegar" = "s" ] || [ "$desplegar" = "S" ]; then
    cd /Users/guillermohaya/Desktop/LUCA/functions
    echo "Compilando..."
    npm run build
    echo "Desplegando..."
    firebase deploy --only functions
    echo -e "${GREEN}✅ Funciones desplegadas${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Activar TWINT en Stripe Dashboard"
echo "2. Agregar cuenta bancaria en Stripe Dashboard"
echo "3. Configurar webhook en Stripe Dashboard"
echo "4. Probar con tarjeta de prueba: 4242 4242 4242 4242"




