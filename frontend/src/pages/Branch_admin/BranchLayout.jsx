import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../Company_admin/styles/CompanyLayout.css";

export default function BranchLayout() {
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
            <span className="brand-logo">B</span>
            <div>
              <div className="brand-name">Branch Admin</div>
              <div className="brand-role">Branch Management</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/branch/dashboard" className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/branch/students" className="nav-link">
              Students
            </NavLink>
            <NavLink to="/branch/fees" className="nav-link">
              Fees
            </NavLink>
            <NavLink to="/branch/sales" className="nav-link">
              Sales
            </NavLink>
            <NavLink to="/branch/inventory" className="nav-link">
              Inventory
            </NavLink>
            <NavLink to="/branch/expenses" className="nav-link">
              Expenses
            </NavLink>
            <NavLink to="/branch/buses" className="nav-link">
              Buses
            </NavLink>
            <NavLink to="/branch/staff-management" className="nav-link">
              Staff Management
            </NavLink>
            <NavLink to="/branch/change-password" className="nav-link">
              Change Password
            </NavLink>
            <NavLink to="/branch/reports" className="nav-link">
              Reports
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
            <div className="main-title">Branch Admin</div>
            <div className="main-user">Branch Admin</div>
          </header>

          <div className="main-body">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}