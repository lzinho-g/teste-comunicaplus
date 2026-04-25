import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "comunicaplus-9d528.firebaseapp.com",
  projectId: "comunicaplus-9d528",
  storageBucket: "comunicaplus-9d528.firebasestorage.app",
  messagingSenderId: "741093637971",
  appId: "1:741093637971:web:8c1d8f7bae20053bd8eba6",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);