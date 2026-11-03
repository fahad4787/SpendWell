import React from "react";
import SiteLogo from "../ui/SiteLogo";
const AppLoader = ({
  message = "Loading…",
  variant = "fullPage",
  className = "",
  showLogo = true,
}) => (
  <div
    className={`app-loader app-loader--${variant} ${className}`.trim()}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="app-loader__content">
      {showLogo ? (
        <div className="app-loader__logo-wrap" aria-hidden="true">
          <SiteLogo variant="brand" iconOnly height={52} animated className="app-loader__logo" />
        </div>
      ) : (
        <span className="app-loader__pulse" aria-hidden="true" />
      )}
      {message ? <p className="app-loader__message">{message}</p> : null}
    </div>
  </div>
);

export default AppLoader;
