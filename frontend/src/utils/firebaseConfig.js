import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY?.trim() || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN?.trim() || "",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL?.trim() || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID?.trim() || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET?.trim() || "",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID?.trim() || "",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim() || "",
};

const isMissingValue = (value = "") => {
  const normalizedValue = String(value).trim();
  return !normalizedValue || normalizedValue.startsWith("YOUR_");
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingKeys = requiredKeys.filter((key) =>
  isMissingValue(firebaseConfig[key]),
);

export const firebaseReady = missingKeys.length === 0;
export const firebaseConfigError = firebaseReady
  ? ""
  : `Firebase is not configured. Add valid Firebase values to your .env file (missing: ${missingKeys.join(", ")}).`;

if (!firebaseReady) {
  console.warn(firebaseConfigError);
}

const app = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const realtimeDb = app ? getDatabase(app) : null;
export const storage = app ? getStorage(app) : null;

export default app;
