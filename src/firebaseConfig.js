// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// YOUR KEY (I copied this from your message)
const firebaseConfig = {
  apiKey: "AIzaSyBZ2KRzmz-ht4grYY3kKkzAGa3re6vypLs",
  authDomain: "vizhithiru-auth.firebaseapp.com",
  projectId: "vizhithiru-auth",
  storageBucket: "vizhithiru-auth.firebasestorage.app",
  messagingSenderId: "1014039595908",
  appId: "1:1014039595908:web:d65933dab9aaa5f0066bd1",
  measurementId: "G-6MXK5XJTWS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication Tools
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();