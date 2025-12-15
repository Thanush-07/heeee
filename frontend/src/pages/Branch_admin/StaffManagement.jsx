import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Staff.css";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [filter, setFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    address: "",
    location: "",
    staffCategory: "teaching",
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.branch_id;

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/branch/${branchId}/staff`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStaff(response.data);
    } catch (error) {
      console.error("Error loading staff:", error);
      alert("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      age: "",
      address: "",
      location: "",
      staffCategory: "teaching",
      photo: null,
    });
    setPhotoPreview(null);
    setEditingStaff(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        data.append(key, formData[key]);
      }
    });

    try {
      if (editingStaff) {
        await axios.put(
          `http://localhost:5000/api/branch/${branchId}/staff/${editingStaff._id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Staff member updated successfully");
      } else {
        await axios.post(
          `http://localhost:5000/api/branch/${branchId}/staff`,
          data,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Staff member added successfully");
      }
      resetForm();
      loadStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert(error.response?.data?.message || "Failed to save staff member");
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      age: staffMember.age,
      address: staffMember.address,
      location: staffMember.location,
      staffCategory: staffMember.staffCategory,
      photo: null,
    });
    setPhotoPreview(
      staffMember.photo
        ? `http://localhost:5000/api/branch/${branchId}/staff/${staffMember._id}/photo`
        : null
    );
    setShowForm(true);
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/branch/${branchId}/staff/${staffId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Staff member deleted successfully");
      loadStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Failed to delete staff member");
    }
  };

  const filteredStaff = staff.filter((member) => {
    if (filter === "all") return true;
    return member.staffCategory === filter;
  });

  if (loading) {
    return <div className="loading">Loading staff members...</div>;
  }

  return (
    <div className="staff-management">
      <div className="staff-header">
        <h2>Staff Management</h2>
        <button
          className="add-staff-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add New Staff"}
        </button>
      </div>

      {showForm && (
        <div className="staff-form-container">
          <form className="staff-form" onSubmit={handleSubmit}>
            <h3>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</h3>

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
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={editingStaff}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="18"
                  max="70"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Staff Category *</label>
                <select
                  name="staffCategory"
                  value={formData.staffCategory}
                  onChange={handleInputChange}
                  required
                >
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                </select>
              </div>

              <div className="form-group">
                <label>Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingStaff ? "Update Staff" : "Add Staff"}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="staff-filters">
        <label>Filter by Category:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Staff</option>
          <option value="teaching">Teaching</option>
          <option value="non-teaching">Non-Teaching</option>
        </select>
      </div>

      <div className="staff-list">
        <h3>Staff Members ({filteredStaff.length})</h3>

        {filteredStaff.length === 0 ? (
          <p className="no-staff">No staff members found.</p>
        ) : (
          <div className="staff-grid">
            {filteredStaff.map((member) => (
              <div key={member._id} className="staff-card">
                <div className="staff-photo">
                  {member.photo ? (
                    <img
                      src={`http://localhost:5000/api/branch/${branchId}/staff/${member._id}/photo`}
                      alt={member.name}
                    />
                  ) : (
                    <div className="no-photo">No Photo</div>
                  )}
                </div>

                <div className="staff-info">
                  <h4>{member.name}</h4>
                  <p className="staff-email">{member.email}</p>
                  <p className="staff-phone">{member.phone}</p>
                  <p className="staff-age">Age: {member.age}</p>
                  <p className="staff-location">{member.location}</p>
                  <p className="staff-address">{member.address}</p>
                  <span
                    className={`staff-category ${
                      member.staffCategory === "teaching"
                        ? "teaching"
                        : "non-teaching"
                    }`}
                  >
                    {member.staffCategory === "teaching"
                      ? "Teaching Staff"
                      : "Non-Teaching Staff"}
                  </span>
                </div>

                <div className="staff-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(member)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(member._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}