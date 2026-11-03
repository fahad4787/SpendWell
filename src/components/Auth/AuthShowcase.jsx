import React, { memo, useEffect, useState } from "react";
import SiteLogo from "../ui/SiteLogo";

const METRICS = [
  {
    key: "summary",
    label: "Summary",
    value: "$48.2k",
    hint: "Net this month",
    bars: [38, 52, 44, 68, 61, 78, 72],
  },
  {
    key: "ledger",
    label: "Transactions",
    value: "214",
    hint: "Posted rows",
    bars: [22, 40, 35, 58, 48, 66, 80],
  },
  {
    key: "cash",
    label: "Cash in hand",
    value: "$6.4k",
    hint: "Available now",
    bars: [48, 42, 55, 50, 62, 58, 70],
  },
];

const AuthShowcase = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % METRICS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="auth-showcase auth-showcase--live">
      <div className="auth-showcase__frame">
        <header className="auth-showcase__top">
          <SiteLogo variant="light" height={40} animated />
        </header>

        <div className="auth-showcase__hero">
          <h1 className="auth-showcase__title">
            Run your money with clarity, not chaos.
          </h1>
          <p className="auth-showcase__lede">
            Spendwell keeps expenses, income, and cash in hand in one place —
            so your team sees the real picture before the next decision.
          </p>
        </div>

        <div className="auth-showcase__board" aria-hidden="true">
          <div className="auth-showcase__board-head">
            <span className="auth-showcase__board-live" />
            <span>This month</span>
            <span className="auth-showcase__board-scan" />
          </div>

          <ul className="auth-showcase__metrics">
            {METRICS.map((metric, index) => {
              const isActive = index === active;
              return (
                <li
                  key={metric.key}
                  className={`auth-showcase__metric${isActive ? " is-active" : ""}`}
                  style={{ "--metric-i": index }}
                >
                  <div className="auth-showcase__metric-top">
                    <span className="auth-showcase__metric-label">{metric.label}</span>
                    <span className="auth-showcase__metric-hint">{metric.hint}</span>
                  </div>
                  <div className="auth-showcase__metric-row">
                    <span className="auth-showcase__metric-value">{metric.value}</span>
                    <span className="auth-showcase__spark" aria-hidden="true">
                      {metric.bars.map((h, bi) => (
                        <span
                          key={bi}
                          className="auth-showcase__spark-bar"
                          style={{
                            "--bar-h": `${h}%`,
                            "--bar-i": bi,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                  <span className="auth-showcase__metric-track">
                    <span
                      className="auth-showcase__metric-fill"
                      style={{ "--fill": `${55 + index * 14}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className="auth-showcase__foot">
          Summary · Transactions · Cash in hand
        </footer>
      </div>
    </div>
  );
};

export default memo(AuthShowcase);
