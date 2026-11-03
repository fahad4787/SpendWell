import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Spendwell Firebase web config (client-safe; protect data with Auth + Firestore rules).
// Env vars override when set — used for both `npm run dev` and `npm run build`.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBdPWewtKJav8u1miYDZ-fQ_vo5T-FRUrU",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "spendwell-37dc4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "spendwell-37dc4",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "spendwell-37dc4.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "951408652336",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:951408652336:web:f64c3b3ee392afe9b0fdf5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics = null;
let analyticsPromise = null;

function initAnalytics() {
  if (analyticsPromise) return analyticsPromise;
  if (!firebaseConfig.measurementId) {
    analyticsPromise = Promise.resolve(null);
    return analyticsPromise;
  }
  analyticsPromise = import("firebase/analytics")
    .then(({ getAnalytics }) => {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn("Analytics initialization failed:", error);
        analytics = null;
      }
      return analytics;
    })
    .catch((error) => {
      console.warn("Analytics load failed:", error);
      analytics = null;
      return null;
    });
  return analyticsPromise;
}

if (typeof window !== "undefined") {
  const schedule =
    typeof window.requestIdleCallback === "function"
      ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
      : (cb) => window.setTimeout(cb, 1);
  schedule(() => {
    initAnalytics();
  });
}

export { auth, db };
