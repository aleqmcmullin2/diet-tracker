import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBceYXOzhh4P4zQykl0BNhSYe6ENuMSR1E",
  authDomain: "meal-tracker-30034.firebaseapp.com",
  projectId: "meal-tracker-30034",
  storageBucket: "meal-tracker-30034.firebasestorage.app",
  messagingSenderId: "386993168834",
  appId: "1:386993168834:web:7846720a4b0a43ced1765b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
