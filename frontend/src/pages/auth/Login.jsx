import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Login.css";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth/login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(API_URL, { email, password });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      switch (user.role) {
        case "company_admin":
           navigate("/company-admin/dashboard");
          break;
        case "institution_admin":
           navigate("/institution/dashboard");
          break;
        case "branch_admin":
          navigate("/branch-admin/dashboard");
          break;
        case "staff":
          navigate("/staff/dashboard");
          break;
        case "parent":
          navigate("/parent/dashboard");
          break;
        default:
          setError("Unknown role");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enterprise-container">
      
      {/* LEFT PANEL */}
      <div className="enterprise-left">
        <div className="left-content">
          <h1>Ematix  School ERP System</h1>
          <p>
            Manage institutions, staff, students, attendance, and parents from a single dashboard.
            A complete enterprise-level education management solution.
          </p>
        </div>
        {/* <div className="left-illustration">
           You can add an SVG or image here 
        </div> */}
      </div>

      {/* RIGHT PANEL */}
      <div className="enterprise-right">
        <div className="form-box">
          <h2>Welcome Back</h2>
          <p className="form-sub">Login to your account</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="admin@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-footer">
  <Link to="/forgot-password">Forgot password?</Link>
</div>
          </form>
        </div>
      </div>

    </div>
  );
}
