import React from "react";
import { RiSearchLine } from "react-icons/ri";

const LedgerSearch = ({
  id = "ledger-search",
  value,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
}) => {
  return (
    <div className="ledger-search">
      <span className="ledger-search__icon" aria-hidden="true">
        <RiSearchLine />
      </span>
      <input
        id={id}
        type="search"
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="ledger-search__input"
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
};

export default LedgerSearch;
