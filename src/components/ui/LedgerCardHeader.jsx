import React from "react";
import { RiCalendarLine } from "react-icons/ri";

const LedgerCardHeader = ({ eyebrow = "Ledger", title, rangeLabel }) => {
  return (
    <div className="ledger-card-header">
      <div className="ledger-card-header__copy">
        {eyebrow ? <p className="ledger-card-header__eyebrow">{eyebrow}</p> : null}
        <h5 className="ledger-card-header__title">{title}</h5>
      </div>
      {rangeLabel ? (
        <div className="ledger-card-header__range" title={rangeLabel}>
          <RiCalendarLine aria-hidden="true" />
          <span>{rangeLabel}</span>
        </div>
      ) : null}
    </div>
  );
};

export default LedgerCardHeader;
