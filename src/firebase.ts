import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2ktQHVwr8TbV64_wFBbE_aob3ha0bNgE",
  authDomain: "t4learningluca.firebaseapp.com",
  projectId: "t4learningluca",
  storageBucket: "t4learningluca.firebasestorage.app",
  messagingSenderId: "614304141450",
  appId: "1:614304141450:web:ad7963722850e79e08dd73"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth }; 