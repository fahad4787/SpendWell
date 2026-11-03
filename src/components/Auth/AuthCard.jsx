import React from "react";
import SiteLogo from "../ui/SiteLogo";
const AuthCard = ({
  title,
  subtitle,
  children,
  showLogo = false,
}) => {
  return (
    <div className="auth-panel">
      {showLogo && (
        <div className="auth-panel__logo">
          <SiteLogo variant="brand" height={40} />
        </div>
      )}
      {(title || subtitle) && (
        <div className="auth-panel__header">
          {title && <h1 className="auth-panel__title">{title}</h1>}
          {subtitle && <p className="auth-panel__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="auth-panel__form">{children}</div>
    </div>
  );
};

export default AuthCard;
