import React from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function getIcon(variant) {
  if (variant === "error") return <FaExclamationCircle aria-hidden="true" />;
  return <FaCheckCircle aria-hidden="true" />;
}

export default function AppToastStack({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="app-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`app-toast app-toast--${t.variant}`}
          style={{ ["--toast-duration-ms"]: `${t.durationMs}ms` }}
          role={t.variant === "error" ? "alert" : "status"}
          onClick={onDismiss ? () => onDismiss(t.id) : undefined}
        >
          <div className="app-toast__content">
            <span className="app-toast__icon">{getIcon(t.variant)}</span>
            <span className="app-toast__message">{t.message}</span>
          </div>
          <div className="app-toast__progress" />
        </div>
      ))}
    </div>
  );
}
