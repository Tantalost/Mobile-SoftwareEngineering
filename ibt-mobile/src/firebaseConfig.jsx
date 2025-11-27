import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: "centralized-ibt-management.firebaseapp.com",
  projectId: "centralized-ibt-management",
  storageBucket: "centralized-ibt-management.firebasestorage.app",
  messagingSenderId: "943202396950",
  appId: "1:943202396950:web:14487af98e8bef2efbfe37"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { db, auth };