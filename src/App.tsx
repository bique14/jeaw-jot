import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PinGate from "@/components/auth/PinGate";
import DashboardPage from "@/pages/DashboardPage";
import ItemsPage from "@/pages/ItemsPage";
import AddItemPage from "@/pages/AddItemPage";
import EditItemPage from "@/pages/EditItemPage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import SetupPage from "@/pages/SetupPage";
import PinPage from "@/pages/PinPage";

export default function App() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/pin" element={<PinPage />} />

      {/* Protected pages */}
      <Route element={<PinGate />}>
        {/* Full-screen pages (no AppShell) */}
        <Route path="/items/new" element={<AddItemPage />} />
        <Route path="/items/:id/edit" element={<EditItemPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/settings/categories" element={<CategoriesPage />} />

        {/* Pages with AppShell nav */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
