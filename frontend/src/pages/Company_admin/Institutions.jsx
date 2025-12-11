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
    logo: "",
    location: ""
  });
  const [editing, setEditing] = useState(false);

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, form);
      } else {
        await axios.post(API_URL, form);
      }
      setForm({ id: "", name: "", institution_id: "", logo: "", location: "" });
      setEditing(false);
      loadData();
    } catch (e) {
      console.error("INSTITUTIONS SAVE ERROR", e);
    }
  };

  const startEdit = (inst) => {
    setForm({
      id: inst._id,
      name: inst.name,
      institution_id: inst.institution_id,
      logo: inst.logo || "",
      location: inst.location || ""
    });
    setEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this institution?")) return;
    await axios.delete(`${API_URL}/${id}`);
    loadData();
  };

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1>Institutions</h1>
          <p>Manage institution details.</p>
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
          <input
            name="logo"
            placeholder="Logo URL"
            value={form.logo}
            onChange={handleChange}
          />
          <button type="submit">
            {editing ? "Update" : "Create"}
          </button>
        </form>
      </div>

      <div className="dash-card">
        <div className="dash-panel-body">
          <table className="dash-table">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Institution ID</th>
                <th align="left">Location</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst._id}>
                  <td>{inst.name}</td>
                  <td>{inst.institution_id}</td>
                  <td>{inst.location}</td>
                  <td>
                    <button onClick={() => startEdit(inst)}>Edit</button>
                    <button onClick={() => handleDelete(inst._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {institutions.length === 0 && (
                <tr>
                  <td colSpan="4" className="dash-empty">
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
