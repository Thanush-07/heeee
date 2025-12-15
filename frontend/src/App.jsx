import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// authentication
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
// company admin
import CompanyLayout from "./pages/Company_admin/components/CompanyLayout";
import CompanyAdminDashboard from "./pages/Company_admin/Dashboard";
import Institutions from "./pages/Company_admin/Institutions";
import Users from "./pages/Company_admin/Users";
import GlobalReport from "./pages/Company_admin/GlobalReport";
// Institution admin
import InstitutionLayout from "./pages/Institution_admin/InstitutionLayout";
import InstitutionDashboard from "./pages/Institution_admin/Dashboard";
import InstitutionBranches from "./pages/Institution_admin/Branches";
import BranchAdmins from "./pages/Institution_admin/Branches";
import InstitutionReports from "./pages/Institution_admin/Reports";
import ChangePassword from "./pages/Institution_admin/ChangePassword";
// Branch admin
import BranchLayout from "./pages/Branch_admin/BranchLayout";
import BranchDashboard from "./pages/Branch_admin/Dashboard";
import BranchStudents from "./pages/Branch_admin/Students";
import BranchFees from "./pages/Branch_admin/Fees";
import BranchSales from "./pages/Branch_admin/Sales";
import BranchInventory from "./pages/Branch_admin/Inventory";
import BranchExpenses from "./pages/Branch_admin/Expenses";
import BranchBuses from "./pages/Branch_admin/Buses";
import BranchReports from "./pages/Branch_admin/Reports";
import BranchChangePassword from "./pages/Branch_admin/ChangePassword";
import BranchStaffManagement from "./pages/Branch_admin/StaffManagement";
// Other roles
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
          <Route path="institutions" element={<Institutions />} />
          <Route path="users" element={<Users />} />
          <Route path="report" element={<GlobalReport />} />
        </Route>

        {/* Institution admin module with layout */}
        <Route path="/institution" element={<InstitutionLayout />}>
          <Route path="dashboard" element={<InstitutionDashboard />} />
          <Route path="branches" element={<InstitutionBranches />} />
          <Route path="branch-admins" element={<BranchAdmins />} />
          <Route path="reports" element={<InstitutionReports />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
        {/* Branch admin module with layout */}
        <Route path="/branch" element={<BranchLayout />}>
          <Route path="dashboard" element={<BranchDashboard />} />
          <Route path="students" element={<BranchStudents />} />
          <Route path="fees" element={<BranchFees />} />
          <Route path="sales" element={<BranchSales />} />
          <Route path="inventory" element={<BranchInventory />} />
          <Route path="expenses" element={<BranchExpenses />} />
          <Route path="buses" element={<BranchBuses />} />
          <Route path="staff-management" element={<BranchStaffManagement />} />
          <Route path="change-password" element={<BranchChangePassword />} />
          <Route path="reports" element={<BranchReports />} />
        </Route>
        {/* Other roles */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
