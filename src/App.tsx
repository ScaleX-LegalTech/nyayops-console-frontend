import { Navigate, Route, HashRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginPage } from "@/pages/LoginPage";
import { HealthPage } from "@/pages/HealthPage";
import { MonitoringPage } from "@/pages/MonitoringPage";
import { TenantsPage } from "@/pages/TenantsPage";
import { TenantUsersPage } from "@/pages/TenantUsersPage";
import { CauseListReviewPage } from "@/pages/CauseListReviewPage";
import { CauseListDocumentPage } from "@/pages/CauseListDocumentPage";
import { FetchHistoryPage } from "@/pages/FetchHistoryPage";
import { BenchConfigsPage } from "@/pages/BenchConfigsPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/health" replace />} />
                <Route path="/health" element={<HealthPage />} />
                <Route path="/monitoring" element={<MonitoringPage />} />
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/tenants/:tenantId/users" element={<TenantUsersPage />} />
                <Route path="/cause-lists/review" element={<CauseListReviewPage />} />
                <Route path="/cause-lists/review/:documentId" element={<CauseListDocumentPage />} />
                <Route path="/cause-lists/fetch-history" element={<FetchHistoryPage />} />
                <Route path="/bench-configs" element={<BenchConfigsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </HashRouter>
  );
}
