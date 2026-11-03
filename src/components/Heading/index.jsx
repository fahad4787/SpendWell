import React from "react";
import { HiOutlineDocumentPlus, HiOutlineBanknotes } from "react-icons/hi2";
import AppButton from "../ui/AppButton";

const SummaryArt = () => (
  <svg className="page-header__svg" viewBox="0 0 280 140" fill="none">
    <defs>
      <linearGradient id="ph-line" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#B8F34B" stopOpacity="0" />
        <stop offset="35%" stopColor="#B8F34B" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#171717" stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id="ph-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B8F34B" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#B8F34B" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g className="page-header__grid" stroke="#171717" strokeOpacity="0.06" strokeWidth="1">
      <line x1="40" y1="28" x2="250" y2="28" />
      <line x1="40" y1="56" x2="250" y2="56" />
      <line x1="40" y1="84" x2="250" y2="84" />
      <line x1="40" y1="112" x2="250" y2="112" />
    </g>
    <path
      className="page-header__area"
      d="M48 96 C78 92, 92 70, 118 66 C144 62, 158 78, 184 58 C210 38, 224 44, 248 34 L248 112 L48 112 Z"
      fill="url(#ph-fill)"
    />
    <path
      className="page-header__spark"
      d="M48 96 C78 92, 92 70, 118 66 C144 62, 158 78, 184 58 C210 38, 224 44, 248 34"
      stroke="url(#ph-line)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      className="page-header__spark-flow"
      d="M48 96 C78 92, 92 70, 118 66 C144 62, 158 78, 184 58 C210 38, 224 44, 248 34"
      stroke="#B8F34B"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
    />
    <circle className="page-header__dot" cx="248" cy="34" r="5" fill="#B8F34B" />
    <circle
      className="page-header__dot-ring"
      cx="248"
      cy="34"
      r="10"
      stroke="#B8F34B"
      strokeOpacity="0.45"
      strokeWidth="1.5"
      fill="none"
    />
    <circle className="page-header__mark page-header__mark--1" cx="118" cy="66" r="3" fill="#171717" fillOpacity="0.55" />
    <circle className="page-header__mark page-header__mark--2" cx="184" cy="58" r="3" fill="#B8F34B" />
  </svg>
);

const TransactionsArt = () => (
  <svg className="page-header__svg page-header__svg--tx" viewBox="0 0 280 140" fill="none">
    <rect className="page-header__tx-sheet" x="56" y="22" width="168" height="100" rx="12" fill="#fff" stroke="#171717" strokeOpacity="0.12" strokeWidth="1.5" />
    <g className="page-header__tx-row page-header__tx-row--1">
      <rect x="72" y="38" width="18" height="18" rx="5" fill="#B8F34B" />
      <rect x="100" y="42" width="88" height="5" rx="2.5" fill="#171717" fillOpacity="0.18" />
      <rect x="100" y="51" width="54" height="4" rx="2" fill="#171717" fillOpacity="0.1" />
      <rect x="196" y="43" width="14" height="8" rx="4" fill="#DC2626" fillOpacity="0.85" />
    </g>
    <g className="page-header__tx-row page-header__tx-row--2">
      <rect x="72" y="66" width="18" height="18" rx="5" fill="#171717" />
      <rect x="100" y="70" width="76" height="5" rx="2.5" fill="#171717" fillOpacity="0.18" />
      <rect x="100" y="79" width="48" height="4" rx="2" fill="#171717" fillOpacity="0.1" />
      <rect x="196" y="71" width="14" height="8" rx="4" fill="#B8F34B" />
    </g>
    <g className="page-header__tx-row page-header__tx-row--3">
      <rect x="72" y="94" width="18" height="18" rx="5" fill="#EEF8D4" stroke="#171717" strokeOpacity="0.2" />
      <rect x="100" y="98" width="96" height="5" rx="2.5" fill="#171717" fillOpacity="0.18" />
      <rect x="100" y="107" width="40" height="4" rx="2" fill="#171717" fillOpacity="0.1" />
      <rect x="196" y="99" width="14" height="8" rx="4" fill="#DC2626" fillOpacity="0.7" />
    </g>
    <circle className="page-header__tx-cursor" cx="210" cy="52" r="4" fill="#B8F34B" />
    <circle className="page-header__tx-cursor-ring" cx="210" cy="52" r="9" stroke="#B8F34B" strokeWidth="1.5" fill="none" />
  </svg>
);

const CashArt = () => (
  <svg className="page-header__svg page-header__svg--cash" viewBox="0 0 280 140" fill="none">
    <rect className="page-header__cash-wallet" x="78" y="34" width="124" height="78" rx="16" fill="#171717" />
    <rect className="page-header__cash-flap" x="78" y="34" width="124" height="22" rx="12" fill="#2A2A2A" />
    <circle className="page-header__cash-snap" cx="172" cy="45" r="5" fill="#B8F34B" />
    <rect className="page-header__cash-note page-header__cash-note--1" x="98" y="66" width="72" height="28" rx="6" fill="#B8F34B" />
    <rect className="page-header__cash-note page-header__cash-note--2" x="106" y="60" width="72" height="28" rx="6" fill="#EEF8D4" stroke="#171717" strokeOpacity="0.12" />
    <circle className="page-header__cash-coin page-header__cash-coin--1" cx="198" cy="78" r="14" fill="#B8F34B" stroke="#171717" strokeWidth="1.5" />
    <circle className="page-header__cash-coin page-header__cash-coin--2" cx="214" cy="96" r="11" fill="#A6DE3A" stroke="#171717" strokeWidth="1.5" />
    <text className="page-header__cash-coin-mark" x="198" y="82" textAnchor="middle" fontSize="10" fontWeight="700" fill="#171717">
      ₨
    </text>
  </svg>
);

const ART = {
  summary: SummaryArt,
  transactions: TransactionsArt,
  cash: CashArt,
};

const Heading = ({
  title,
  subtitle,
  btnTxt,
  onBtnClick,
  actions,
  filters = null,
  variant = "summary",
}) => {
  const hasRight = Boolean(btnTxt || actions || filters);
  const Art = ART[variant] || SummaryArt;

  return (
    <header className={`page-header page-header--${variant}`}>
      <div className="page-header__art" aria-hidden="true">
        <Art />
      </div>

      <div className="page-header__main">
        <div className="page-header__top">
          <p className="page-header__eyebrow">Expense workspace</p>
          {hasRight ? (
            <div className="page-header__actions">
              {filters ? <div className="page-header__filters">{filters}</div> : null}
              {btnTxt ? (
                <AppButton tone="primary" size="xs" onClick={onBtnClick}>
                  {variant === "cash" ? (
                    <HiOutlineBanknotes aria-hidden="true" />
                  ) : (
                    <HiOutlineDocumentPlus aria-hidden="true" />
                  )}
                  {btnTxt}
                </AppButton>
              ) : null}
              {actions}
            </div>
          ) : null}
        </div>

        <div className="page-header__copy">
          <h1 className="page-header__title">{title}</h1>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
};

export default Heading;
