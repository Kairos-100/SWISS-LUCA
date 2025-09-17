import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2ktQHVwr8TbV64_wFBbE_aob3haObNgE",
  authDomain: "t4learningluca.firebaseapp.com",
  projectId: "t4learningluca",
  storageBucket: "t4learningluca.firebasestorage.app",
  messagingSenderId: "614304141450",
  appId: "1:614304141450:web:ad7963722850e79e08dd73"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configuración para desarrollo local (opcional)
// if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

export { 
  app, 
  auth, 
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
}; 