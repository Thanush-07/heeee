import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Students.css";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    class: "all",
    academicYear: "all"
  });
  const [stats, setStats] = useState({
    summary: { total: 0, active: 0, left: 0, transferred: 0 },
    classBreakdown: []
  });
  const [formData, setFormData] = useState({
    name: "",
    class: "",
    section: "",
    rollNo: "",
    parentName: "",
    phoneNo: "",
    address: "",
    admissionNumber: "",
    academicYear: "",
    status: "active"
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.branch_id;

  // Check if user is authenticated and has branch_id
  if (!user.id || !branchId) {
    return (
      <div className="students-management">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You must be logged in as a branch admin to access this page.</p>
          <p>Please <a href="/login">login</a> with a branch admin account.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadStudents();
    loadStats();
  }, [filters]);

  const loadStudents = async () => {
    try {
      const params = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.class !== "all") params.class = filters.class;
      if (filters.academicYear !== "all") params.academicYear = filters.academicYear;

      const response = await axios.get(
        `http://localhost:5000/api/branch/${branchId}/students`,
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStudents(response.data);
    } catch (error) {
      console.error("Error loading students:", error);
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/branch/${branchId}/students/stats/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const generateAdmissionNumber = async () => {
    if (!formData.academicYear) {
      alert("Please select academic year first");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/branch/${branchId}/students/generate-admission-number`,
        { academicYear: formData.academicYear },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFormData({ ...formData, admissionNumber: response.data.admissionNumber });
    } catch (error) {
      console.error("Error generating admission number:", error);
      alert("Failed to generate admission number");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      class: "",
      section: "",
      rollNo: "",
      parentName: "",
      phoneNo: "",
      address: "",
      admissionNumber: "",
      academicYear: "",
      status: "active"
    });
    setEditingStudent(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        await axios.put(
          `http://localhost:5000/api/branch/${branchId}/students/${editingStudent._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        alert("Student updated successfully");
      } else {
        await axios.post(
          `http://localhost:5000/api/branch/${branchId}/students`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        alert("Student added successfully");
      }
      resetForm();
      loadStudents();
      loadStats();
    } catch (error) {
      console.error("Error saving student:", error);
      alert(error.response?.data?.message || "Failed to save student");
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      class: student.class,
      section: student.section,
      rollNo: student.rollNo,
      parentName: student.parentName,
      phoneNo: student.phoneNo,
      address: student.address,
      admissionNumber: student.admissionNumber,
      academicYear: student.academicYear,
      status: student.status
    });
    setShowForm(true);
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/branch/${branchId}/students/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Student deleted successfully");
      loadStudents();
      loadStats();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "#27ae60";
      case "left": return "#e74c3c";
      case "transferred": return "#f39c12";
      default: return "#95a5a6";
    }
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="students-management">
      <div className="students-header">
        <h2>Student Management</h2>
        <button
          className="add-student-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add New Student"}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <span className="stat-value">{stats.summary.total}</span>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <span className="stat-value active">{stats.summary.active}</span>
        </div>
        <div className="stat-card">
          <h3>Left</h3>
          <span className="stat-value left">{stats.summary.left}</span>
        </div>
        <div className="stat-card">
          <h3>Transferred</h3>
          <span className="stat-value transferred">{stats.summary.transferred}</span>
        </div>
      </div>

      {/* Class Breakdown */}
      {stats.classBreakdown.length > 0 && (
        <div className="class-breakdown">
          <h3>Class Distribution</h3>
          <div className="class-grid">
            {stats.classBreakdown.map((item) => (
              <div key={item._id} className="class-item">
                <span className="class-name">Class {item._id}</span>
                <span className="class-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="student-form-container">
          <form className="student-form" onSubmit={handleSubmit}>
            <h3>{editingStudent ? "Edit Student" : "Add New Student"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Parent Name *</label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class *</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Class</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div className="form-group">
                <label>Section *</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Roll No *</label>
                <input
                  type="text"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone No *</label>
                <input
                  type="tel"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Academic Year *</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Academic Year</option>
                  <option value="2024/25">2024/25</option>
                  <option value="2025/26">2025/26</option>
                  <option value="2026/27">2026/27</option>
                </select>
              </div>

              <div className="form-group">
                <label>Admission Number *</label>
                <div className="admission-input-group">
                  <input
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={handleInputChange}
                    required
                    disabled={editingStudent}
                  />
                  {!editingStudent && (
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={generateAdmissionNumber}
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="left">Left</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingStudent ? "Update Student" : "Add Student"}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="students-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="left">Left</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Class:</label>
          <select name="class" value={filters.class} onChange={handleFilterChange}>
            <option value="all">All Classes</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Class {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Academic Year:</label>
          <select name="academicYear" value={filters.academicYear} onChange={handleFilterChange}>
            <option value="all">All Years</option>
            <option value="2024/25">2024/25</option>
            <option value="2025/26">2025/26</option>
            <option value="2026/27">2026/27</option>
          </select>
        </div>
      </div>

      <div className="students-list">
        <h3>Students ({students.length})</h3>

        {students.length === 0 ? (
          <p className="no-students">No students found.</p>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll No</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.admissionNumber}</td>
                    <td>{student.name}</td>
                    <td>{student.class}</td>
                    <td>{student.section}</td>
                    <td>{student.rollNo}</td>
                    <td>{student.parentName}</td>
                    <td>{student.phoneNo}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(student.status) }}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(student)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(student._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}