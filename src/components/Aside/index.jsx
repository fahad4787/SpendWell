import React from "react";
import { Link, useLocation } from "react-router-dom";
import SiteLogo from "../ui/SiteLogo";
import {
  EXPENSE_VIEWS,
  expenseViewFromPath,
  expenseViewPath,
} from "../../utils/expenseViews";

const SideMenu = ({ isSidebarOpen, onNavigate }) => {
  const { pathname } = useLocation();
  const activeView = expenseViewFromPath(pathname);

  return (
    <aside
      className={`sidebar${isSidebarOpen ? " is-open" : " is-closed"}`}
      aria-hidden={!isSidebarOpen}
      inert={!isSidebarOpen ? true : undefined}
    >
      <div className="sidebar__ambient" aria-hidden="true" />

      <div className="sidebar__inner">
        <header className="sidebar-header">
          <Link
            to="/"
            className="sidebar-brand"
            onClick={onNavigate}
            aria-label="Spendwell home"
          >
            <SiteLogo variant="light" height={30} animated />
          </Link>
        </header>

        <nav className="sidebar-nav" aria-label="Expense views">
          <ul>
            {EXPENSE_VIEWS.map((view, index) => {
              const Icon = view.icon;
              const active = activeView === view.key;
              return (
                <li key={view.key} style={{ "--nav-i": index }}>
                  <Link
                    to={expenseViewPath(view.key)}
                    className={`sidebar-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <span className="sidebar-link__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="sidebar-link__label">{view.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default SideMenu;
