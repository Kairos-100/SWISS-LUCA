// Script para verificar la configuración de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2ktQHVwr8TbV64_wFBbE_aob3ha0bNgE",
  authDomain: "t4learningluca.firebaseapp.com",
  projectId: "t4learningluca",
  storageBucket: "t4learningluca.firebasestorage.app",
  messagingSenderId: "614304141450",
  appId: "1:614304141450:web:ad7963722850e79e08dd73"
};

console.log('🔍 Verificando configuración de Firebase...');

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  console.log('✅ Firebase inicializado correctamente');
  console.log('📊 Configuración:');
  console.log(`   - Project ID: ${firebaseConfig.projectId}`);
  console.log(`   - Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`   - API Key: ${firebaseConfig.apiKey.substring(0, 10)}...`);
  
  // Verificar que los servicios estén disponibles
  if (auth) {
    console.log('✅ Authentication service disponible');
  }
  
  if (db) {
    console.log('✅ Firestore service disponible');
  }
  
  console.log('\n🎯 Próximos pasos:');
  console.log('1. Abre http://localhost:5174/ en tu navegador');
  console.log('2. Abre las herramientas de desarrollador (F12)');
  console.log('3. Ve a la pestaña Console');
  console.log('4. Intenta crear una cuenta y revisa los errores');
  console.log('5. También puedes probar el archivo test-auth.html');
  
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
}
