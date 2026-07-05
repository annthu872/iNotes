import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

// Add your Firebase project values to a local .env file.
// Use .env.example as the template and keep the VITE_ prefix on each variable.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID?.trim() || "(default)";

export const firebaseProjectId = firebaseConfig.projectId;
export const firebaseDatabaseId = firestoreDatabaseId;
export const db = getFirestore(app, firestoreDatabaseId);
