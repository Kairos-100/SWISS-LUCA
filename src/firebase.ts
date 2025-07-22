import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuaf9g7tl3otHA8qFjlM7jgTFnx6qbPr0",
  authDomain: "switchzeland-revolutionized.firebaseapp.com",
  projectId: "switchzeland-revolutionized",
  storageBucket: "switchzeland-revolutionized.appspot.com",
  messagingSenderId: "751520990509",
  appId: "1:751520990509:web:91368b091fb18748c2ffa4",
  measurementId: "G-MBETG0P6SS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth }; 