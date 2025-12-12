import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import CompanyLayout from "./pages/Company_admin/components/CompanyLayout";
import CompanyAdminDashboard from "./pages/Company_admin/Dashboard";
import Institutions from "./pages/Company_admin/Institutions";
import Users from "./pages/Company_admin/Users";
import GlobalReport from "./pages/Company_admin/GlobalReport";
import InstitutionDashboard from "./pages/Institution_admin/Dashboard";
import BranchAdminDashboard from "./pages/Branch_admin/Dashboard";
import StaffDashboard from "./pages/Staff/Dashboard";
import ParentDashboard from "./pages/Parent/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Company admin module with layout */}
        <Route path="/company-admin" element={<CompanyLayout />}>
          <Route path="dashboard" element={<CompanyAdminDashboard />} />
          <Route path="Institutions" element={<Institutions />} />
          <Route path="users" element={<Users />} />
          <Route path="report" element={<GlobalReport />} />
        </Route>

        {/* Institution admin module with layout */}
        <Route path="/InstitutionDashboard" element={<InstitutionDashboard />} />  
        <Route path="/institution/*" element={<InstitutionLayout />} />
 {/* Other roles */}
        <Route path="/branch-admin/dashboard" element={<BranchAdminDashboard />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
