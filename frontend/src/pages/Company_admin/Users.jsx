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
    if (editing) {
      await axios.put(`${API_URL}/${form.id}`, form);
    } else {
      await axios.post(API_URL, form);
    }
    setForm({ id: "", name: "", email: "", phone: "", institution_id: "" });
    setEditing(false);
    loadData();
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
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    await axios.delete(`${API_URL}/${id}`);
    loadData();
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
        </form>
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
                    <button onClick={() => handleDelete(a._id)}>Delete</button>
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
