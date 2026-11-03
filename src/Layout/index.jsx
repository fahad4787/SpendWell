import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideMenu from "../components/Aside";
import Header from "../components/Header";
import AntdAppProvider from "../components/ui/AntdAppProvider";

const enterPlayedKeys = new Set();

function enterKeyForPath(pathname) {
  return pathname.replace(/\/$/, "") || "/";
}

function PagePending() {
  return <div className="page-pending" aria-busy="true" aria-label="Loading page" />;
}

const Layout = ({ onLogout, userName = "" }) => {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => !window.matchMedia("(max-width: 768px)").matches
  );

  const playEnter = useMemo(() => {
    const key = enterKeyForPath(pathname);
    if (enterPlayedKeys.has(key)) return false;
    enterPlayedKeys.add(key);
    return true;
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const handleResize = (event) => setIsSidebarOpen(!event.matches);
    media.addEventListener("change", handleResize);
    return () => media.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen((open) => !open);
  };

  const closeSidebarOnMobile = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setIsSidebarOpen(false);
    }
  };

  const layoutMainClass = [
    "layout-main",
    !isSidebarOpen && "layout-main--sidebar-closed",
  ]
    .filter(Boolean)
    .join(" ");

  const contentClass = ["content", playEnter ? "content--enter-once" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <AntdAppProvider>
      <div className={`layout${isSidebarOpen ? " layout--sidebar-open" : ""}`}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SideMenu
          isSidebarOpen={isSidebarOpen}
          onNavigate={closeSidebarOnMobile}
        />
        <button
          type="button"
          className="layout-sidebar-backdrop"
          aria-label="Close navigation"
          tabIndex={isSidebarOpen ? 0 : -1}
          onClick={() => setIsSidebarOpen(false)}
        />
        <div className={layoutMainClass}>
          <Header
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            userName={userName}
            onLogout={onLogout}
          />
          <main id="main-content" className={contentClass} tabIndex={-1}>
            <Suspense fallback={<PagePending />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </AntdAppProvider>
  );
};

export default Layout;
