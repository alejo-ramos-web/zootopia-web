import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmaUBjjN4-dLvUZqhwjK4ckCUWbZiVS3A",
  authDomain: "zootopia-web.firebaseapp.com",
  projectId: "zootopia-web",
  storageBucket: "zootopia-web.firebasestorage.app",
  messagingSenderId: "848780185691",
  appId: "1:848780185691:web:739182b5e6b91874c7af7e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);