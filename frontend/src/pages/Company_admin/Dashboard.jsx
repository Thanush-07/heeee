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

  // Filter branches client-side to show only branches of the selected institution
  const filteredBranches = useMemo(() => {
    if (!selectedInstitution) return branches;
    return branches.filter(
      (b) => String(b.institutionId || b.institution_id) === selectedInstitution
    );
  }, [branches, selectedInstitution]);

  const loadData = async (institutionId = "", branchId = "") => {
    setLoading(true);
    try {
      const params = {};
      if (institutionId) params.institutionId = institutionId;
      if (branchId) params.branchId = branchId;

      const res = await axios.get(API_URL, { params });

      console.log("DASHBOARD DATA =>", res.data);

      setTotals(res.data.totals);
      // Expect backend to send institutions + branches
      setInstitutions(res.data.institutions || []);
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
      setInstitutions([]);
      setBranches([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load with no filters
    loadData();
  }, []);

  const handleInstitutionChange = (e) => {
    const value = e.target.value;
    setSelectedInstitution(value);
    // reset branch when institution changes
    setSelectedBranch("");
    loadData(value || "", "");
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setSelectedBranch(value);
    loadData(selectedInstitution || "", value || "");
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
          <p>Key metrics across institutions and branches.</p>
        </div>

        <div className="dash-filter-group">
          <div className="dash-filter">
            <label>Institution</label>
            <select
              value={selectedInstitution}
              onChange={handleInstitutionChange}
            >
              <option value="">All institutions</option>
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
              <option value="">All branches</option>
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
            {selectedBranch
              ? "Selected branch"
              : selectedInstitution
              ? "Selected institution"
              : "All institutions & branches"}
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
                {filteredBranches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.institutionName}</td>
                  </tr>
                ))}
                {filteredBranches.length === 0 && (
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
