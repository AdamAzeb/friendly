import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGlNuUV1Hvqjm-0wDfZu7N6_12qFaclOU",
  authDomain: "friendly-86718.firebaseapp.com",
  projectId: "friendly-86718",
  storageBucket: "friendly-86718.firebasestorage.app",
  messagingSenderId: "1090229625063",
  appId: "1:1090229625063:web:fa5d4f4dfc2ea8941ac242",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
