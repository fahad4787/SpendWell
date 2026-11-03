import React from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { getDisplayInitials } from "../../utils/displayName";
import AppButton from "../ui/AppButton";

const Header = ({ toggleSidebar, isSidebarOpen = true, onLogout, userName }) => {
  const initials = getDisplayInitials(userName);

  return (
    <header className="header">
      <div className="header-left">
        {toggleSidebar ? (
          <button
            type="button"
            className={`menu-toggle${isSidebarOpen ? " menu-toggle--close" : " menu-toggle--open"}`}
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <FaXmark size={18} aria-hidden="true" /> : <FaBars size={18} aria-hidden="true" />}
          </button>
        ) : null}
        <div className="header-title">
          <span className="header-title__eyebrow">Spendwell</span>
          <strong>Expense workspace</strong>
        </div>
      </div>
      <div className="header-right">
        {userName ? (
          <div className="header-user" title={userName}>
            <span className="header-user__avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="header-user__name">{userName}</span>
          </div>
        ) : null}
        {onLogout ? (
          <AppButton tone="ghost" size="sm" onClick={onLogout}>
            Sign out
          </AppButton>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
