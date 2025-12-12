// src/firebase.js

import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"   // ✅ NEW
// Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDZyLHfJC3NnKSyGBp75Dp_So_zHQnzyYE",
  authDomain: "eaters-b05df.firebaseapp.com",
  projectId: "eaters-b05df",
  storageBucket: "eaters-b05df.firebasestorage.app",
  messagingSenderId: "892763323626",
  appId: "1:892763323626:web:f0d6d8c96feaf81cab6b93",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export authentication
export const auth = getAuth(app)

// Export Google Provider
export const googleProvider = new GoogleAuthProvider()

// Firestore DB export
export const db = getFirestore(app)