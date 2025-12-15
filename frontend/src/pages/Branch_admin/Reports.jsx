// src/pages/Branch_admin/Reports.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../Company_admin/styles/CompanyDashboard.css";

const API_BASE = "http://localhost:5000/api/branch";

export default function BranchReports() {
  const [activeReport, setActiveReport] = useState("students");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.branch_id || user.branchId || null;

  const reportTypes = [
    { id: "students", label: "Student List Report", icon: "👥" },
    { id: "fees", label: "Fee Collected Report", icon: "💰" },
    { id: "pending", label: "Pending Fee Report", icon: "⏳" },
    { id: "daily", label: "Daily Fee Collection Summary", icon: "📊" },
    { id: "billing", label: "Billing Report", icon: "📄" },
    { id: "stock", label: "Stock Report", icon: "📦" },
    { id: "attendance", label: "Staff Attendance Report", icon: "✅" },
    { id: "expenses", label: "Expense Report", icon: "💸" },
    { id: "transport", label: "Bus Transport Report", icon: "🚌" },
  ];

  const loadReport = async (reportType) => {
    if (!branchId) return;
    setLoading(true);
    try {
      let url = `${API_BASE}/${branchId}/reports/${reportType}`;
      const params = {};

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.category) params.category = filters.category;

      const res = await axios.get(url, { params });
      setReportData(res.data);
    } catch (err) {
      console.error("BRANCH REPORT ERROR", err.response?.data || err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport) {
      loadReport(activeReport);
    }
  }, [activeReport, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const renderReportContent = () => {
    if (!reportData) return <p className="dash-empty">No data available</p>;

    switch (activeReport) {
      case "students":
        return (
          <div className="report-content">
            <h3>Student List Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Enrollment Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students?.map(student => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.className}</td>
                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "fees":
        return (
          <div className="report-content">
            <h3>Fee Collected Report</h3>
            <div className="report-summary">
              <div className="dash-card">
                <span className="dash-card-label">Total Collected</span>
                <span className="dash-card-value">₹ {reportData.totalCollected || 0}</span>
              </div>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.fees?.map(fee => (
                  <tr key={fee._id}>
                    <td>{fee.studentName}</td>
                    <td>₹ {fee.amount}</td>
                    <td>{new Date(fee.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "pending":
        return (
          <div className="report-content">
            <h3>Pending Fee Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                {reportData.pendingFees?.map(student => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.className}</td>
                    <td>₹ {student.pendingAmount || 0}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "daily":
        return (
          <div className="report-content">
            <h3>Daily Fee Collection Summary</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Collected</th>
                  <th>Number of Payments</th>
                </tr>
              </thead>
              <tbody>
                {reportData.dailySummary?.map(day => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>₹ {day.total}</td>
                    <td>{day.count}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "billing":
        return (
          <div className="report-content">
            <h3>Billing Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Student Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.billings?.map(bill => (
                  <tr key={bill._id}>
                    <td>{bill.invoiceNumber || "N/A"}</td>
                    <td>{bill.studentName}</td>
                    <td>₹ {bill.amount}</td>
                    <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "stock":
        return (
          <div className="report-content">
            <h3>Stock Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.stock?.map(item => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.minQuantity}</td>
                    <td>
                      {item.currentStock <= item.minQuantity ? (
                        <span className="badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge-success">OK</span>
                      )}
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "attendance":
        return (
          <div className="report-content">
            <h3>Staff Attendance Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.attendance?.map(record => (
                  <tr key={record._id}>
                    <td>{record.staffName}</td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.status}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "expenses":
        return (
          <div className="report-content">
            <h3>Expense Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {reportData.expenses?.map(expense => (
                  <tr key={expense._id}>
                    <td>{expense.description}</td>
                    <td>₹ {expense.amount}</td>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.category}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      case "transport":
        return (
          <div className="report-content">
            <h3>Bus Transport Report</h3>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Route</th>
                  <th>Students</th>
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                {reportData.transport?.map(bus => (
                  <tr key={bus._id}>
                    <td>{bus.busNumber}</td>
                    <td>{bus.route}</td>
                    <td>{bus.studentCount}</td>
                    <td>{bus.driverName}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p className="dash-empty">Select a report type</p>;
    }
  };

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1>Branch Reports</h1>
          <p>Comprehensive reports for branch operations</p>
        </div>

        <div className="dash-filter-group">
          <div className="dash-filter">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="dash-filter">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {loading && <p className="dash-hint">Loading report…</p>}

      <div className="dash-bottom">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Report Types</h2>
            <p>Select a report to view</p>
          </div>
          <div className="dash-panel-body">
            <div className="report-types">
              {reportTypes.map(report => (
                <button
                  key={report.id}
                  className={`report-type-btn ${activeReport === report.id ? "active" : ""}`}
                  onClick={() => setActiveReport(report.id)}
                >
                  <span className="report-icon">{report.icon}</span>
                  <span className="report-label">{report.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Report Data</h2>
            <p>{reportTypes.find(r => r.id === activeReport)?.label || "Select a report"}</p>
          </div>
          <div className="dash-panel-body">
            {renderReportContent()}
          </div>
        </section>
      </div>
    </div>
  );
}