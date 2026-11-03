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
import { AppToastProvider, useAppToast } from "./components/ui/AppToastProvider";
import AppToastStack from "./components/ui/AppToastStack";
import AppLoader from "./components/ui/AppLoader";
import { canAccessExpense, UNPROVISIONED_ROLE } from "./utils/access";

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
  // Login refresh / signed-out boot — match auth shell colors
  if (path === "/login" || path.startsWith("/login/")) return "auth";
  return "fullPage";
}

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) return undefined;
    // Clear boot tint from index.html once the real shell mounts
    document.documentElement.style.background = "";
    document.body.style.background = "";
    return undefined;
  }, [loading]);

  useEffect(() => {
    let generation = 0;
    let initialAuthPass = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const request = ++generation;

      // Only block the UI on the first auth resolution — later null/user
      // changes should not flash a full-page loader over login/app.
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

  if (loading || (user && !userRole)) {
    return <LoadingFallback variant={resolveBootLoaderVariant()} />;
  }

  return (
    <AppToastProvider>
      <Router>
        <ToastRenderer />
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
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
              user && canAccessExpense(userRole) ? (
                <Layout onLogout={handleLogout} userName={userName} />
              ) : (
                <Navigate to="/login" replace />
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

          <Route path="*" element={<Navigate to={user && canAccessExpense(userRole) ? "/" : "/login"} replace />} />
        </Routes>
      </Router>
    </AppToastProvider>
  );
};

export default App;
