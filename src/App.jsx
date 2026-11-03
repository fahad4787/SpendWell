import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import Layout from "./Layout";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import { AppToastProvider, useAppToast } from "./components/ui/AppToastProvider";
import AppToastStack from "./components/ui/AppToastStack";
import AppLoader from "./components/ui/AppLoader";
import { canAccessExpense, UNPROVISIONED_ROLE } from "./utils/access";
import { isSetupComplete } from "./utils/bootstrap";

function ToastRenderer() {
  const { toasts, removeToast } = useAppToast();
  return <AppToastStack toasts={toasts} onDismiss={removeToast} />;
}

const Expense = lazy(() => import("./pages/Expense"));

function ProtectedRoute({ children, user, userRole }) {
  if (!user || !userRole) return <Navigate to="/login" replace />;
  if (!canAccessExpense(userRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LoadingFallback({ message = "Loading…", variant = "fullPage" }) {
  return <AppLoader message={message} variant={variant} />;
}

function resolveBootLoaderVariant() {
  if (typeof window === "undefined") return "fullPage";
  const path = window.location.pathname || "/";
  if (
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/signup" ||
    path.startsWith("/signup/")
  ) {
    return "auth";
  }
  return "fullPage";
}

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [booting, setBooting] = useState(true);
  const [setupComplete, setSetupComplete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const done = await isSetupComplete();
      if (!cancelled) setSetupComplete(done);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (booting) return undefined;
    document.documentElement.style.background = "";
    document.body.style.background = "";
    return undefined;
  }, [booting]);

  const readUserProfile = useCallback(async (currentUser) => {
    if (!currentUser) return { role: null, name: "" };

    let role = UNPROVISIONED_ROLE;
    let name = currentUser.email?.split("@")[0] || "User";

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        role = data.role || "admin";
        name = data.username || name;
      }
    } catch {
      role = UNPROVISIONED_ROLE;
    }

    return { role, name };
  }, []);

  const applyAuthUser = useCallback(
    async (currentUser, { retryUnprovisioned = false } = {}) => {
      let profile = await readUserProfile(currentUser);

      if (
        retryUnprovisioned &&
        currentUser &&
        profile.role === UNPROVISIONED_ROLE
      ) {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
          profile = await readUserProfile(currentUser);
          if (profile.role !== UNPROVISIONED_ROLE) break;
        }
      }

      setUserRole(profile.role);
      setUserName(profile.name);
      setUser(currentUser);

      if (profile.role && canAccessExpense(profile.role)) {
        void import("./pages/Expense");
      }

      return profile;
    },
    [readUserProfile]
  );

  useEffect(() => {
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const request = ++generation;
      await applyAuthUser(currentUser, { retryUnprovisioned: Boolean(currentUser) });
      if (request !== generation) return;
      setBooting(false);
    });

    return () => {
      generation += 1;
      unsubscribe();
    };
  }, [applyAuthUser]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Keep the router mounted — flipping a full-page loader here blanked the app after signup.
  const handleRegistered = async () => {
    setSetupComplete(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return applyAuthUser(currentUser, { retryUnprovisioned: true });
  };

  if (booting || setupComplete === null) {
    return <LoadingFallback variant={resolveBootLoaderVariant()} />;
  }

  const needsSetup = setupComplete === false;
  const authedHome = Boolean(user && canAccessExpense(userRole));

  return (
    <AppToastProvider>
      <Router>
        <ToastRenderer />
        <Routes>
          <Route
            path="/signup"
            element={
              needsSetup ? (
                authedHome ? (
                  <Navigate to="/" replace />
                ) : (
                  <Signup setupComplete={false} onRegistered={handleRegistered} />
                )
              ) : (
                <Navigate to={authedHome ? "/" : "/login"} replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              needsSetup ? (
                <Navigate to="/signup" replace />
              ) : !user ? (
                <Login onLogin={() => setUser(auth.currentUser)} />
              ) : canAccessExpense(userRole) ? (
                <Navigate to="/" replace />
              ) : (
                <Login
                  onLogin={() => setUser(auth.currentUser)}
                  onSignedOut={() => {
                    setUser(null);
                    setUserRole(null);
                  }}
                  lockedMessage="You’re signed in, but this account has no Spendwell role in Firestore yet. Sign out, then add a users profile (role: admin) or finish setup after publishing Firestore rules."
                />
              )
            }
          />

          <Route
            element={
              authedHome ? (
                <Layout onLogout={handleLogout} userName={userName} />
              ) : (
                <Navigate to={needsSetup ? "/signup" : "/login"} replace />
              )
            }
          >
            <Route
              index
              element={
                <ProtectedRoute user={user} userRole={userRole}>
                  <Suspense fallback={<LoadingFallback message="Loading…" variant="inline" />}>
                    <Expense />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="transactions"
              element={
                <ProtectedRoute user={user} userRole={userRole}>
                  <Suspense fallback={<LoadingFallback message="Loading…" variant="inline" />}>
                    <Expense />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="cash"
              element={
                <ProtectedRoute user={user} userRole={userRole}>
                  <Suspense fallback={<LoadingFallback message="Loading…" variant="inline" />}>
                    <Expense />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="expense" element={<Navigate to="/" replace />} />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to={authedHome ? "/" : needsSetup ? "/signup" : "/login"}
                replace
              />
            }
          />
        </Routes>
      </Router>
    </AppToastProvider>
  );
};

export default App;
