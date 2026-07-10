import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Prevent duplicate initialization
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const rtdb: Database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
