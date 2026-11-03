import React from "react";

/**
 * Spendwell mark — animated growth bars (ledger ascending).
 * Variants: brand (on light), light (on charcoal).
 */
const SiteLogo = ({
  variant = "brand",
  height = 36,
  animated = true,
  showWordmark = true,
  iconOnly = false,
  className = "",
}) => {
  const showWord = showWordmark && !iconOnly;
  const classes = [
    "spendwell-logo",
    `spendwell-logo--${variant}`,
    animated ? "spendwell-logo--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={{ "--logo-h": `${height}px` }} aria-label="Spendwell">
      <svg
        className="spendwell-logo__mark"
        viewBox="0 0 40 40"
        width={height}
        height={height}
        role="img"
        aria-hidden={showWord ? "true" : undefined}
      >
        <rect className="spendwell-logo__plate" x="1" y="1" width="38" height="38" rx="11" />

        {/* Baseline ledger */}
        <line
          className="spendwell-logo__baseline"
          x1="9"
          y1="30.5"
          x2="31"
          y2="30.5"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Rising bars */}
        <rect className="spendwell-logo__bar spendwell-logo__bar--1" x="10" y="24" width="4.5" height="6.5" rx="1.2" />
        <rect className="spendwell-logo__bar spendwell-logo__bar--2" x="17.75" y="18.5" width="4.5" height="12" rx="1.2" />
        <rect className="spendwell-logo__bar spendwell-logo__bar--3" x="25.5" y="12" width="4.5" height="18.5" rx="1.2" />

        {/* Growth tip pulse on tallest bar */}
        <circle className="spendwell-logo__tip" cx="27.75" cy="10.2" r="2.1" />
      </svg>

      {showWord ? (
        <span className="spendwell-logo__word">
          Spend<span>well</span>
        </span>
      ) : null}
    </span>
  );
};

export default SiteLogo;
