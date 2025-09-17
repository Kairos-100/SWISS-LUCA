# Solución de Problemas de Autenticación - LUCA App

## Problemas Comunes y Soluciones

### 1. Error al crear nueva cuenta

**Síntomas:**
- El botón "Crear cuenta" no funciona
- Aparece un mensaje de error genérico
- La aplicación se queda cargando

**Soluciones:**

#### A. Verificar configuración de Firebase
1. Asegúrate de que el archivo `src/firebase.ts` tenga la configuración correcta
2. Verifica que el proyecto Firebase esté activo en la consola de Firebase
3. Confirma que la autenticación por email/password esté habilitada en Firebase Console

#### B. Verificar reglas de Firestore
1. Las reglas actuales permiten acceso completo hasta septiembre 2025
2. Si las reglas han expirado, actualiza `firestore.rules`:

```javascript
rules_version='2'
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

#### C. Validaciones del formulario
- **Nombre**: Mínimo 2 caracteres
- **Email**: Formato válido (ejemplo@dominio.com)
- **Contraseña**: Mínimo 6 caracteres
- **Confirmar contraseña**: Debe coincidir con la contraseña

### 2. Error al iniciar sesión

**Síntomas:**
- Credenciales correctas pero no funciona
- Mensaje de error "Usuario no encontrado"
- Error de red

**Soluciones:**

#### A. Verificar credenciales
1. Confirma que el email esté escrito correctamente
2. Verifica que la contraseña sea la correcta
3. Intenta restablecer la contraseña desde Firebase Console

#### B. Verificar estado de la cuenta
1. Ve a Firebase Console > Authentication > Users
2. Confirma que la cuenta existe y esté habilitada
3. Si la cuenta está deshabilitada, habilítala

### 3. Problemas de red

**Síntomas:**
- Error de conexión
- Timeout en las operaciones
- Errores de red

**Soluciones:**

#### A. Verificar conexión a internet
1. Confirma que tienes conexión a internet
2. Intenta acceder a otros sitios web
3. Verifica que no haya firewall bloqueando la conexión

#### B. Verificar configuración de Firebase
1. Confirma que las claves de API sean correctas
2. Verifica que el dominio esté autorizado en Firebase Console
3. Si estás en desarrollo local, asegúrate de que `localhost` esté en la lista de dominios autorizados

### 4. Errores específicos de Firebase

#### auth/email-already-in-use
- **Causa**: Ya existe una cuenta con ese email
- **Solución**: Usa un email diferente o inicia sesión con la cuenta existente

#### auth/weak-password
- **Causa**: La contraseña es muy débil
- **Solución**: Usa una contraseña de al menos 6 caracteres

#### auth/invalid-email
- **Causa**: Formato de email inválido
- **Solución**: Usa un formato válido (ejemplo@dominio.com)

#### auth/user-not-found
- **Causa**: No existe cuenta con ese email
- **Solución**: Crea una nueva cuenta o verifica el email

#### auth/wrong-password
- **Causa**: Contraseña incorrecta
- **Solución**: Verifica la contraseña o restablécela

#### auth/too-many-requests
- **Causa**: Demasiados intentos fallidos
- **Solución**: Espera unos minutos antes de intentar de nuevo

### 5. Debugging

#### A. Verificar consola del navegador
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca errores relacionados con Firebase o autenticación

#### B. Verificar Network
1. Ve a la pestaña Network
2. Busca llamadas fallidas a Firebase
3. Verifica los códigos de estado HTTP

#### C. Logs de Firebase
1. Ve a Firebase Console > Functions > Logs
2. Busca errores relacionados con autenticación

### 6. Configuración recomendada

#### A. Firebase Console
1. Ve a Authentication > Sign-in method
2. Habilita "Email/Password"
3. Configura las opciones de verificación de email si es necesario

#### B. Reglas de Firestore
```javascript
rules_version='2'
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir solo su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Otras colecciones según necesidad
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. Contacto

Si los problemas persisten:
1. Revisa los logs de la consola del navegador
2. Verifica la configuración de Firebase
3. Confirma que todas las dependencias estén actualizadas
4. Intenta en un navegador diferente
5. Limpia la caché del navegador

### 8. Comandos útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Verificar errores de TypeScript
npx tsc --noEmit

# Limpiar caché
npm run clean
```

