import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { UsersPage } from '../features/users/UsersPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { CategoriesPage } from '../features/products/CategoriesPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { PurchasesPage } from '../features/inventory/PurchasesPage';
import { ExpiryDamagedPage } from '../features/inventory/ExpiryDamagedPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { PosPage } from '../features/billing/PosPage';
import { BillsPage } from '../features/billing/BillsPage';
import { SalesReturnsPage } from '../features/sales-returns/SalesReturnsPage';
import { SupplierReturnsPage } from '../features/stock-returns/SupplierReturnsPage';
import { ReportsPage } from '../features/reports/ReportsPage';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  permission?: string;
}> = ({ children, permission }) => {
  const { token, user, hasPermission } = useAuthStore();
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Billing & POS */}
        <Route
          path="pos"
          element={
            <ProtectedRoute permission="billing:create">
              <PosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="bills"
          element={
            <ProtectedRoute permission="billing:view_own">
              <BillsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales-returns"
          element={
            <ProtectedRoute permission="sales_returns:manage">
              <SalesReturnsPage />
            </ProtectedRoute>
          }
        />

        {/* Catalog & Inventory */}
        <Route
          path="products"
          element={
            <ProtectedRoute permission="products:read">
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories"
          element={
            <ProtectedRoute permission="products:read">
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute permission="inventory:read">
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchases"
          element={
            <ProtectedRoute permission="purchases:manage">
              <PurchasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="supplier-returns"
          element={
            <ProtectedRoute permission="supplier_returns:manage">
              <SupplierReturnsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="expiry-damaged"
          element={
            <ProtectedRoute permission="inventory:read">
              <ExpiryDamagedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="expiry-management"
          element={
            <ProtectedRoute permission="inventory:read">
              <ExpiryDamagedPage defaultView="expiry" />
            </ProtectedRoute>
          }
        />
        <Route
          path="damaged-medicines"
          element={
            <ProtectedRoute permission="inventory:read">
              <ExpiryDamagedPage defaultView="damaged" />
            </ProtectedRoute>
          }
        />
        <Route
          path="suppliers"
          element={
            <ProtectedRoute permission="inventory:read">
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute permission="billing:create">
              <CustomersPage />
            </ProtectedRoute>
          }
        />

        {/* Reports, Users, Settings */}
        <Route
          path="reports"
          element={
            <ProtectedRoute permission="reports:view">
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute permission="users:read">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute permission="settings:manage">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
