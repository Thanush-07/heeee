// src/pages/Company_admin/Institutions.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/CompanyDashboard.css";

const API_URL = "http://localhost:5000/api/company/institutions";

export default function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    institution_id: "",
    location: "",
    maxBranches: 7
  });
  const [editing, setEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadData = async () => {
    try {
      const res = await axios.get(API_URL);
      setInstitutions(res.data);
    } catch (e) {
      console.error("INSTITUTIONS LOAD ERROR", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // ensure maxBranches stored as number
    if (name === "maxBranches") {
      setForm({ ...form, [name]: Number(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      institution_id: "",
      location: "",
      maxBranches: 7
    });
    setEditing(false);
    setLogoFile(null);
  };

  const uploadLogoForId = async (instId) => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append("logo", logoFile);
    setUploadingLogo(true);
    try {
      await axios.post(`${API_URL}/${instId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } catch (err) {
      console.error("LOGO UPLOAD ERROR", err);
      alert("Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        institution_id: form.institution_id,
        location: form.location,
        maxBranches: form.maxBranches
      };

      let instId = form.id;

      if (editing) {
        const res = await axios.put(`${API_URL}/${form.id}`, payload);
        instId = res.data._id;
      } else {
        const res = await axios.post(API_URL, payload);
        instId = res.data._id;
      }

      if (logoFile) {
        await uploadLogoForId(instId);
      }

      resetForm();
      loadData();
    } catch (e) {
      console.error("INSTITUTIONS SAVE ERROR", e);
      alert("Failed to save institution");
    }
  };

  const startEdit = (inst) => {
    setForm({
      id: inst._id,
      name: inst.name,
      institution_id: inst.institution_id,
      location: inst.location || "",
      maxBranches: inst.maxBranches ?? 7
    });
    setEditing(true);
    setLogoFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this institution?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      loadData();
    } catch (e) {
      console.error("INSTITUTION DELETE ERROR", e);
      alert("Failed to delete institution");
    }
  };

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1>Institutions</h1>
          <p>Manage institution details, branch limits, and logos.</p>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: 14 }}>
        <form className="inst-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="institution_id"
            placeholder="Institution ID"
            value={form.institution_id}
            onChange={handleChange}
            required
          />
          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
          />

          {/* max branches per institution */}
          <input
            type="number"
            name="maxBranches"
            min={1}
            max={7}
            value={form.maxBranches}
            onChange={handleChange}
            placeholder="Max branches (1-7)"
          />

          {/* logo upload */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files[0] || null)}
          />
          {uploadingLogo && <span className="dash-hint">Uploading logo…</span>}

          <button type="submit">
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              type="button"
              style={{ marginLeft: 8 }}
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dash-card">
        <div className="dash-panel-body">
          <table className="dash-table">
            <thead>
              <tr>
                <th align="left">Logo</th>
                <th align="left">Name</th>
                <th align="left">Institution ID</th>
                <th align="left">Location</th>
                <th align="left">Max branches</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst._id}>
                  <td>
                    <img
                      src={`http://localhost:5000/api/company/institutions/${inst._id}/logo`}
                      alt={inst.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 8
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </td>
                  <td>{inst.name}</td>
                  <td>{inst.institution_id}</td>
                  <td>{inst.location}</td>
                  <td>{inst.maxBranches ?? 7}</td>
                  <td>
                    <button onClick={() => startEdit(inst)}>Edit</button>
                    <button onClick={() => handleDelete(inst._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {institutions.length === 0 && (
                <tr>
                  <td colSpan="6" className="dash-empty">
                    No institutions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
