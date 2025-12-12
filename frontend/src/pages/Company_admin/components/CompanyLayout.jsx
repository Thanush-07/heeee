// src/components/layout/CompanyLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/CompanyLayout.css";

export default function CompanyLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-logo">SE</span>
          <div className="brand-text">
            <div className="brand-name">School ERP</div>
            <div className="brand-role">Company Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/company-admin/dashboard" className="nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/company-admin/institutions" className="nav-link">
            Institutions
          </NavLink>
          <NavLink to="/company-admin/users" className="nav-link">
            Super Admins
          </NavLink>
          <NavLink to="/company-admin/report" className="nav-link">
            Global Report
          </NavLink>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <header className="main-header">
          <button className="menu-btn" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
          <div className="main-title">Company overview</div>
          <div className="main-user">Company Admin</div>
        </header>

        <div className="main-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
