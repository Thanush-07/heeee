import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/CompanyDashboard.css";

const API_URL = "http://localhost:5000/api/company/dashboard";

export default function CompanyAdminDashboard() {
  const [totals, setTotals] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (branchId = "") => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        params: branchId ? { branchId } : {}
      });

      console.log("DASHBOARD DATA =>", res.data);

      setTotals(res.data.totals);
      setBranches(res.data.branches || []);
      setRecent(res.data.recentActivities || []);
    } catch (err) {
      console.error("DASHBOARD LOAD ERROR", err);
      setTotals({
        institutions: 0,
        branches: 0,
        students: 0,
        feeCollected: 0
      });
      setBranches([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setSelectedBranch(value);
    loadData(value || "");
  };

  if (!totals) {
    return (
      <div className="dash-wrapper">
        <div className="dash-card">Loading…</div>
      </div>
    );
  }

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1>Overview</h1>
          <p>Key metrics across all institutions and branches.</p>
        </div>

        <div className="dash-filter">
          <label>Branch</label>
          <select value={selectedBranch} onChange={handleBranchChange}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.institutionName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="dash-hint">Refreshing data…</p>}

      <div className="dash-cards">
        <div className="dash-card">
          <span className="dash-card-label">Institutions</span>
          <span className="dash-card-value">{totals.institutions}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Branches</span>
          <span className="dash-card-value">{totals.branches}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Students</span>
          <span className="dash-card-value">{totals.students}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Fee collected</span>
          <span className="dash-card-value">
            ₹ {totals.feeCollected.toLocaleString()}
          </span>
          <span className="dash-card-note">
            {selectedBranch ? "Selected branch" : "All branches"}
          </span>
        </div>
      </div>

      <div className="dash-bottom">
        <section className="dash-panel">
          <header className="dash-panel-head">
            <h2>Branches</h2>
            <p>Branches mapped to their institutions.</p>
          </header>
          <div className="dash-panel-body">
            <table className="dash-table">
              <thead>
                <tr>
                  <th align="left">Branch</th>
                  <th align="left">Institution</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.institutionName}</td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td colSpan="2" className="dash-empty">
                      No branches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-panel">
          <header className="dash-panel-head">
            <h2>Recent activity</h2>
            <p>Latest changes in institutions and branches.</p>
          </header>
          <div className="dash-panel-body">
            {recent.length === 0 && (
              <p className="dash-empty">No recent activity.</p>
            )}
            <ul className="dash-activity">
              {recent.map((item) => (
                <li key={item.id}>
                  <div className="dash-activity-title">{item.description}</div>
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
