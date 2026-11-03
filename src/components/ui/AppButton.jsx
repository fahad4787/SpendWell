import React from "react";

const TONES = new Set(["primary", "secondary", "danger", "ghost"]);

const SIZES = {
  xs: "app-btn--xs",
  sm: "app-btn--sm",
  md: "app-btn--md",
};

/**
 * Spendwell button — use everywhere instead of raw <button> / Bootstrap Button.
 */
const AppButton = ({
  tone = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  loading = false,
  loadingText,
  block = false,
  children,
  ...rest
}) => {
  const resolvedTone = TONES.has(tone) ? tone : "primary";
  const sizeClass = SIZES[size] || SIZES.md;
  const isBusy = Boolean(loading);

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || isBusy}
      aria-busy={isBusy || undefined}
      className={[
        "app-btn",
        `app-btn--${resolvedTone}`,
        sizeClass,
        block ? "app-btn--block" : "",
        isBusy ? "is-loading" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="app-btn__fill" aria-hidden="true" />
      <span className="app-btn__content">
        {isBusy ? (
          <>
            <span className="app-btn__spinner" aria-hidden="true" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
};

export default AppButton;
