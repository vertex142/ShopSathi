import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Check if essential Firebase config values are present.
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let auth: firebase.auth.Auth | null = null;
let db: Firestore | null = null;

// Only initialize Firebase if the config is valid to prevent crashes.
if (isFirebaseConfigured) {
  try {
    const app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // If initialization fails (e.g., malformed config), auth and db will remain null,
    // and the app will show the config error page.
  }
}

export { auth, db };
