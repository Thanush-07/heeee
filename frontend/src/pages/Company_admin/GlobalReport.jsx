import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/CompanyDashboard.css";
import "./styles/Globalreport.css";

const REPORT_URL = "http://localhost:5000/api/company/report/global";
const INST_URL = "http://localhost:5000/api/company/institutions";

export default function GlobalReport() {
  const [institutionStats, setInstitutionStats] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [filters, setFilters] = useState({
    institutionId: "",
    branchId: ""
  });
  const [loading, setLoading] = useState(false);

  const loadInstitutions = async () => {
    try {
      const res = await axios.get(INST_URL);
      setInstitutions(res.data);
    } catch (e) {
      console.error("LOAD INST ERROR", e);
    }
  };

  const loadReport = async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get(REPORT_URL, { params });
      setInstitutionStats(res.data.institutionStats || []);
      setBranchStats(res.data.branchStats || []);
    } catch (e) {
      console.error("LOAD GLOBAL REPORT ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
    loadReport();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const next = { ...filters, [name]: value };
    // clear branchId if institution changes
    if (name === "institutionId") next.branchId = "";
    setFilters(next);
  };

  const applyFilters = () => {
    const params = {};
    if (filters.institutionId) params.institutionId = filters.institutionId;
    if (filters.branchId) params.branchId = filters.branchId;
    loadReport(params);
  };

  const handleDownload = async () => {
    try {
      const params = {};
      if (filters.institutionId) params.institutionId = filters.institutionId;
      if (filters.branchId) params.branchId = filters.branchId;
      params.format = "csv";

      const res = await axios.get(REPORT_URL, {
        params,
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "global_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("DOWNLOAD GLOBAL REPORT ERROR", e);
    }
  };

  const currentBranches =
    filters.institutionId && institutions.length
      ? institutions
          .find((i) => i._id === filters.institutionId)
          ?.branches || []
      : [];

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1>Global report</h1>
          <p>Institution and branch wise students, staff and fee.</p>
        </div>

        <div className="dash-header-actions">
          <button className="dash-report-btn" onClick={handleDownload}>
            Download CSV
          </button>
        </div>
      </div>

      <div className="dash-filter-row">
        <div className="dash-filter">
          <label>Institution</label>
          <select
            name="institutionId"
            value={filters.institutionId}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {institutions.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        {/* Optional: if you store branches in institution doc, else you can build a separate branch list */}
        {/* <div className="dash-filter">
          <label>Branch</label>
          <select
            name="branchId"
            value={filters.branchId}
            onChange={handleFilterChange}
            disabled={!filters.institutionId}
          >
            <option value="">All</option>
            {currentBranches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.branch_name}
              </option>
            ))}
          </select>
        </div> */}

        <button className="dash-apply-btn" onClick={applyFilters}>
          Apply filters
        </button>
      </div>

      {loading && <p className="dash-hint">Loading report…</p>}

      <div className="dash-bottom">
        <section className="dash-panel">
          <header className="dash-panel-head">
            <h2>Institution wise</h2>
            <p>Totals per institution.</p>
          </header>
          <div className="dash-panel-body">
            <table className="dash-table">
              <thead>
                <tr>
                  <th align="left">Institution</th>
                  <th align="right">Students</th>
                  <th align="right">Staff</th>
                  <th align="right">Fee</th>
                </tr>
              </thead>
              <tbody>
                {institutionStats.map((r) => (
                  <tr key={r.institutionId}>
                    <td>{r.institutionName || r.institutionId}</td>
                    <td align="right">{r.students}</td>
                    <td align="right">{r.staff}</td>
                    <td align="right">₹ {r.fee.toLocaleString()}</td>
                  </tr>
                ))}
                {institutionStats.length === 0 && (
                  <tr>
                    <td colSpan="4" className="dash-empty">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-panel">
          <header className="dash-panel-head">
            <h2>Branch wise</h2>
            <p>Totals per branch.</p>
          </header>
          <div className="dash-panel-body">
            <table className="dash-table">
              <thead>
                <tr>
                  <th align="left">Branch</th>
                  <th align="right">Students</th>
                  <th align="right">Staff</th>
                  <th align="right">Fee</th>
                </tr>
              </thead>
              <tbody>
                {branchStats.map((r) => (
                  <tr key={r.branchId}>
                    <td>{r.branchName || r.branchId}</td>
                    <td align="right">{r.students}</td>
                    <td align="right">{r.staff}</td>
                    <td align="right">₹ {r.fee.toLocaleString()}</td>
                  </tr>
                ))}
                {branchStats.length === 0 && (
                  <tr>
                    <td colSpan="4" className="dash-empty">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
