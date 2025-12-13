import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/CompanyLayout.css";

export default function CompanyLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="shell">
        <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
          <div className="sidebar-brand">
            <span className="brand-logo">E</span>
            <div>
              <div className="brand-name">Ematix School ERP</div>
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
            <button className="menu-btn" onClick={() => setOpen(true)}>
              ☰
            </button>
            <div className="main-title">Company Overview</div>
            <div className="main-user">Company Admin</div>
          </header>

          <div className="main-body">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
