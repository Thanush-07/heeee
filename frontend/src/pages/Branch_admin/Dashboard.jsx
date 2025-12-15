// src/pages/Branch_admin/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../Company_admin/styles/CompanyDashboard.css";

const API_URL_BASE = "http://localhost:5000/api/branch";

export default function BranchDashboard() {
  const [totals, setTotals] = useState(null);
  const [branch, setBranch] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const branchId = user?.branch_id || user?.branchId || null;

  const loadData = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL_BASE}/${branchId}/dashboard`);

      setBranch(res.data.branch || null);
      setTotals(
        res.data.totals || {
          students: 0,
          feeCollected: 0,
          staff: 0,
        }
      );
      setRecent(res.data.recentActivities || []);
    } catch (err) {
      console.error("BRANCH DASH ERROR", err.response?.data || err.message);
      setBranch(null);
      setTotals({
        students: 0,
        feeCollected: 0,
        staff: 0,
      });
      setRecent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!branchId) {
    return (
      <div className="dash-wrapper">
        <div className="dash-card">
          Branch not set for this admin.
        </div>
      </div>
    );
  }

  if (!totals) {
    return (
      <div className="dash-wrapper">
        <div className="dash-card">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dash-wrapper">
      <div className="dash-header inst-header">
        <div className="inst-header-main">
          {branch && (
            <img
              className="inst-logo"
              src={`${API_URL_BASE}/${branchId}/logo`}
              alt={branch.name}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div>
            <h1>{branch?.name || "Branch Dashboard"}</h1>
            <p>Overview of students, fees and operations in this branch.</p>
          </div>
        </div>

        {loading && (
          <span className="dash-hint">Refreshing data…</span>
        )}
      </div>

      <div className="dash-cards">
        <div className="dash-card">
          <span className="dash-card-label">Students</span>
          <span className="dash-card-value">{totals.students}</span>
        </div>

        <div className="dash-card">
          <span className="dash-card-label">Fee Collected</span>
          <span className="dash-card-value">
            ₹ {totals.feeCollected.toLocaleString()}
          </span>
          <span className="dash-card-note">
            Branch-wide fee collection
          </span>
        </div>

        <div className="dash-card">
          <span className="dash-card-label">Staff</span>
          <span className="dash-card-value">{totals.staff}</span>
        </div>
      </div>

      <div className="dash-bottom">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Branch Details</h2>
            <p>Information about this branch</p>
          </div>

          <div className="dash-panel-body">
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Detail</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{branch?.name}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td>{branch?.address}</td>
                  </tr>
                  <tr>
                    <td>Location</td>
                    <td>{branch?.location}</td>
                  </tr>
                  <tr>
                    <td>Manager</td>
                    <td>{branch?.managerName}</td>
                  </tr>
                  <tr>
                    <td>Contact</td>
                    <td>{branch?.contactPhone}</td>
                  </tr>
                  <tr>
                    <td>Classes</td>
                    <td>{branch?.classes?.join(", ")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Recent Activity</h2>
            <p>Latest changes in this branch</p>
          </div>

          <div className="dash-panel-body">
            {recent.length === 0 && (
              <p className="dash-empty">No recent activity</p>
            )}

            <ul className="dash-activity">
              {recent.map((item) => (
                <li key={item.id}>
                  <div className="dash-activity-title">
                    {item.description}
                  </div>
                  <div className="dash-activity-meta">
                    {item.when} • {item.by}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
