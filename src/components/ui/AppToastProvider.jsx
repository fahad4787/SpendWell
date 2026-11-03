import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from "react";

const AppToastContext = createContext(null);

export function useAppToast() {
  const ctx = useContext(AppToastContext);
  if (!ctx) throw new Error("useAppToast must be used inside AppToastProvider");
  return ctx;
}

let toastIdCounter = 0;

export function AppToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ message, variant = "success", durationMs = 3500 }) => {
      const id = `toast-${toastIdCounter++}`;
      const normalizedVariant = variant === "danger" ? "error" : variant;

      setToasts((prev) => [
        // Keep the newest toast front-and-center above the table
        {
          id,
          message,
          variant: normalizedVariant,
          durationMs,
          createdAt: Date.now(),
        },
        ...prev.slice(0, 2),
      ]);

      const timeoutId = setTimeout(() => removeToast(id), durationMs);
      timeoutsRef.current.set(id, timeoutId);
      return id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
    }),
    [toasts, showToast, removeToast]
  );

  return <AppToastContext.Provider value={value}>{children}</AppToastContext.Provider>;
}

