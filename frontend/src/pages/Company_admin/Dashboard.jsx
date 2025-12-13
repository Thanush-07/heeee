import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./styles/CompanyDashboard.css";

const API_URL = "http://localhost:5000/api/company/dashboard";

export default function CompanyAdminDashboard() {
  const [totals, setTotals] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredBranches = useMemo(() => {
    if (!selectedInstitution) return branches;
    return branches.filter(
      (b) =>
        String(b.institutionId || b.institution_id) === selectedInstitution
    );
  }, [branches, selectedInstitution]);

  const loadData = async (institutionId = "", branchId = "") => {
    setLoading(true);
    try {
      const params = {};
      if (institutionId) params.institutionId = institutionId;
      if (branchId) params.branchId = branchId;

      const res = await axios.get(API_URL, { params });

      setTotals(res.data.totals);
      setInstitutions(res.data.institutions || []);
      setBranches(res.data.branches || []);
      setRecent(res.data.recentActivities || []);
    } catch (err) {
      console.error(err);
      setTotals({
        institutions: 0,
        branches: 0,
        students: 0,
        feeCollected: 0
      });
      setInstitutions([]);
      setBranches([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInstitutionChange = (e) => {
    const value = e.target.value;
    setSelectedInstitution(value);
    setSelectedBranch("");
    loadData(value, "");
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setSelectedBranch(value);
    loadData(selectedInstitution, value);
  };

  if (!totals) {
    return (
      <div className="dash-wrapper">
        <div className="dash-card">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dash-wrapper">
      {/* HEADER */}
      <div className="dash-header">
        <div>
          <h1>Company Overview</h1>
          <p>Real-time summary across institutions and branches</p>
        </div>

        <div className="dash-filter-group">
          <div className="dash-filter">
            <label>Institution</label>
            <select
              value={selectedInstitution}
              onChange={handleInstitutionChange}
            >
              <option value="">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst._id || inst.id} value={inst._id || inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div className="dash-filter">
            <label>Branch</label>
            <select value={selectedBranch} onChange={handleBranchChange}>
              <option value="">All Branches</option>
              {filteredBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.institutionName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="dash-hint">Refreshing data…</p>}

      {/* CARDS */}
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
          <span className="dash-card-label">Fee Collected</span>
          <span className="dash-card-value">
            ₹ {totals.feeCollected.toLocaleString()}
          </span>
          <span className="dash-card-note">
            {selectedBranch
              ? "Selected Branch"
              : selectedInstitution
              ? "Selected Institution"
              : "All Data"}
          </span>
        </div>
      </div>

      {/* PANELS */}
      <div className="dash-bottom">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Branches</h2>
            <p>Mapped institutions and branches</p>
          </div>

          <div className="dash-panel-body">
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Institution</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map((b) => (
                    <tr key={b.id}>
                      <td>{b.name}</td>
                      <td>{b.institutionName}</td>
                    </tr>
                  ))}
                  {filteredBranches.length === 0 && (
                    <tr>
                      <td colSpan="2" className="dash-empty">
                        No branches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Recent Activity</h2>
            <p>Latest changes and updates</p>
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
