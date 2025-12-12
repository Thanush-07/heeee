import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/CompanyDashboard.css";

const API_URL = "http://localhost:5000/api/company/admins";
const INST_URL = "http://localhost:5000/api/company/institutions";

export default function Users() {
  const [admins, setAdmins] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    institution_id: ""
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [a, i] = await Promise.all([
        axios.get(API_URL),
        axios.get(INST_URL)
      ]);
      setAdmins(a.data);
      setInstitutions(i.data);
    } catch (e) {
      console.error("USERS LOAD ERROR", e);
      setError("Failed to load admins or institutions");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      email: "",
      phone: "",
      institution_id: ""
    });
    setEditing(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        institution_id: form.institution_id
      };

      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error("ADMIN SAVE ERROR", err);
      const msg =
        err.response?.data?.message ||
        "Failed to save admin (check required fields / duplicate email)";
      setError(msg);
      alert(msg);
    }
  };

  const startEdit = (a) => {
    setForm({
      id: a._id,
      name: a.name,
      email: a.email,
      phone: a.phone || "",
      institution_id: a.institution_id?._id || a.institution_id || ""
    });
    setEditing(true);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      loadData();
    } catch (err) {
      console.error("ADMIN DELETE ERROR", err);
      const msg =
        err.response?.data?.message || "Failed to delete admin";
      setError(msg);
      alert(msg);
    }
  };

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1>Super Admins</h1>
          <p>Institution admin accounts.</p>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: 14 }}>
        <form className="user-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />
          <select
            name="institution_id"
            value={form.institution_id}
            onChange={handleChange}
            required
          >
            <option value="">Select institution</option>
            {institutions.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>
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
        {error && (
          <p style={{ color: "red", marginTop: 8 }}>{error}</p>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-panel-body">
          <table className="dash-table">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Email</th>
                <th align="left">Institution</th>
                <th align="left">Status</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.institution_id?.name || "-"}</td>
                  <td>{a.status}</td>
                  <td>
                    <button onClick={() => startEdit(a)}>Edit</button>
                    <button onClick={() => handleDelete(a._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan="5" className="dash-empty">
                    No admins yet.
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
