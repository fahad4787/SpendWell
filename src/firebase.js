// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // For Firebase Authentication
import { getFirestore } from "firebase/firestore";  // For Firestore Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);  // For Authentication
const db = getFirestore(app);  // For Firestore Database

// Analytics loads after first paint so it stays off the critical path.
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

// Export the services to use them in other parts of your app
export { auth, db, analytics, initAnalytics };
