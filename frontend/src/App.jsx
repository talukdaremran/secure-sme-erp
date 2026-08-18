import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import SalesOrdersPage from "./pages/SalesOrdersPage";
import InvoicesPage from "./pages/InvoicesPage";
import InventoryPage from "./pages/InventoryPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import UsersPage from "./pages/UsersPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import SuppliersPage from "./pages/SuppliersPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import LandingPage from "./pages/LandingPage";
import PortalHomePage from "./pages/PortalHomePage";
import PortalLoginPage from "./pages/PortalLoginPage";
import PortalRegisterPage from "./pages/PortalRegisterPage";
import PortalVerifyEmailPage from "./pages/PortalVerifyEmailPage";

import CustomerPortalLayout from "./layouts/CustomerPortalLayout";
import CustomerCartPage from "./pages/CustomerCartPage";
import CustomerOrdersPage from "./pages/CustomerOrdersPage";
import CustomerProductsPage from "./pages/CustomerProductsPage";
import CustomerProductDetailPage from "./pages/CustomerProductDetailPage";

import SupplierPortalLayout from "./layouts/SupplierPortalLayout";
import SupplierPurchaseOrdersPage from "./pages/SupplierPurchaseOrdersPage";

import AiAnalyticsPage from "./pages/AiAnalyticsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      <Route path="/customer/register" element={<PortalRegisterPage role="customer" />} />
      <Route path="/customer/verify-email" element={<PortalVerifyEmailPage role="customer" />} />
      <Route path="/customer/login" element={<PortalLoginPage role="customer" />} />

      <Route path="/customer" element={<CustomerPortalLayout />}>
        <Route index element={<Navigate to="/customer/products" replace />} />
        <Route path="home" element={<Navigate to="/customer/products" replace />} />
        <Route path="products" element={<CustomerProductsPage />} />
        <Route path="/customer/products/:id" element={<CustomerProductDetailPage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
      </Route>

      <Route path="/supplier/register" element={<PortalRegisterPage role="supplier" />} />
      <Route path="/supplier/verify-email" element={<PortalVerifyEmailPage role="supplier" />} />
      <Route path="/supplier/login" element={<PortalLoginPage role="supplier" />} />
      <Route path="/supplier" element={<SupplierPortalLayout />}>
        <Route index element={<Navigate to="/supplier/purchase-orders" replace />} />
        <Route path="home" element={<Navigate to="/supplier/purchase-orders" replace />} />
        <Route path="purchase-orders" element={<SupplierPurchaseOrdersPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />

        <Route element={<AppLayout />}>
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/sales-orders" element={<SalesOrdersPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/ai-analytics" element={<AiAnalyticsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;