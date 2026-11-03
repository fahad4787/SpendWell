import React, { useState, useEffect, lazy, Suspense } from "react";
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
  const [loading, setLoading] = useState(true);
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
    if (loading) return undefined;
    document.documentElement.style.background = "";
    document.body.style.background = "";
    return undefined;
  }, [loading]);

  useEffect(() => {
    let generation = 0;
    let initialAuthPass = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const request = ++generation;

      if (initialAuthPass) {
        setLoading(true);
      }

      let role = null;
      let name = "";

      if (currentUser) {
        name = currentUser.email?.split("@")[0] || "User";
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || "admin";
            name = data.username || name;
          } else {
            role = UNPROVISIONED_ROLE;
          }
        } catch {
          role = UNPROVISIONED_ROLE;
        }
      }

      if (request !== generation) return;
      setUserRole(role);
      setUserName(name);
      setUser(currentUser);
      setLoading(false);
      initialAuthPass = false;

      if (role && canAccessExpense(role)) {
        void import("./pages/Expense");
      }
    });

    return () => {
      generation += 1;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleRegistered = () => {
    setSetupComplete(true);
  };

  if (loading || (user && !userRole) || setupComplete === null) {
    return <LoadingFallback variant={resolveBootLoaderVariant()} />;
  }

  const needsSetup = setupComplete === false;
  const authedHome = user && canAccessExpense(userRole);

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
                <Navigate to="/login" replace />
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
                  lockedMessage="Your account does not have expense access. Sign out and use an expense-enabled user."
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
                  <Expense />
                </ProtectedRoute>
              }
            />
            <Route
              path="transactions"
              element={
                <ProtectedRoute user={user} userRole={userRole}>
                  <Expense />
                </ProtectedRoute>
              }
            />
            <Route
              path="cash"
              element={
                <ProtectedRoute user={user} userRole={userRole}>
                  <Expense />
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
