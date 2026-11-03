import React, { useEffect, useState } from "react";
import AuthShowcase from "../components/Auth/AuthShowcase";

const AuthLayout = ({ children }) => {
  const [showShowcase, setShowShowcase] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 992px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 992px)");
    const sync = () => setShowShowcase(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="auth-shell">
      {showShowcase ? (
        <div className="auth-shell__showcase">
          <AuthShowcase />
        </div>
      ) : null}
      <div className="auth-shell__form">
        <div className="auth-shell__form-inner">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
