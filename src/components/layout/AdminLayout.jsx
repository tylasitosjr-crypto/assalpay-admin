import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { adminNavbarTitleFromPath } from "../../constants/adminUiLabels.js";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = useMemo(() => adminNavbarTitleFromPath(pathname), [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="admin-shell" style={{ display: "flex" }}>
      <div
        className={`admin-sidebar-wrap${sidebarOpen ? " is-open" : ""}`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && (
        <button
          type="button"
          className="admin-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="admin-main">
        <Navbar title={title} onOpenMenu={() => setSidebarOpen(true)} />
        <main style={{ padding: "1rem", flex: 1 }}>
          <Outlet />
        </main>
      </div>
      <Tooltip id="assal-admin-tip" style={{ zIndex: 20000 }} />
    </div>
  );
}
