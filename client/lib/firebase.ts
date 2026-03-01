import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCT5gvHxDGarfWdepfiCLQRtrMym_ho4qs",
  authDomain: "friendly-d222c.firebaseapp.com",
  projectId: "friendly-d222c",
  storageBucket: "friendly-d222c.firebasestorage.app",
  messagingSenderId: "590603919025",
  appId: "1:590603919025:web:40f0ae8709740c89298c90",
};

// Prevent re-initialization on Turbopack / HMR hot reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
