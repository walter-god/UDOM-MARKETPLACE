import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ProjectDetailPage from './pages/marketplace/ProjectDetailPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import DeveloperDashboard from './pages/dashboard/DeveloperDashboard';
import UploadProjectPage from './pages/dashboard/UploadProjectPage';
import SubscriptionPage from './pages/dashboard/SubscriptionPage';
import PaymentsPage from './pages/dashboard/PaymentsPage';
import BookmarksPage from "./pages/dashboard/BookmarksPage";
import MyProjectsPage from "./pages/dashboard/MyProjectsPage";
import EditProjectPage from "./pages/dashboard/EditProjectPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminActivityLogsPage from './pages/admin/AdminActivityLogsPage';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerPendingPage from './pages/lecturer/LecturerPendingPage';
import LecturerSupervisedPage from './pages/lecturer/LecturerSupervisedPage';
import LecturerDuplicateCheckPage from './pages/lecturer/LecturerDuplicateCheckPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:slug" element={<ProjectDetailPage />} />

          {/* Student Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="subscriptions" element={<SubscriptionPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="projects" element={<MyProjectsPage />} />
            <Route path="projects/:id/edit" element={<EditProjectPage />} />
            <Route path="upload" element={<UploadProjectPage />} />
          </Route>

          {/* Developer Dashboard */}
          <Route path="/developer" element={<ProtectedRoute roles={['developer', 'admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DeveloperDashboard />} />
            <Route path="upload" element={<UploadProjectPage />} />
            <Route path="projects" element={<DeveloperDashboard />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="subscriptions" element={<SubscriptionPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="activity-logs" element={<AdminActivityLogsPage />} />
          </Route>

          {/* Lecturer Dashboard */}
          <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer', 'admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<LecturerDashboard />} />
            <Route path="pending" element={<LecturerPendingPage />} />
            <Route path="pending/:pk" element={<LecturerPendingPage />} />
            <Route path="supervised" element={<LecturerSupervisedPage />} />
            <Route path="duplicate-check" element={<LecturerDuplicateCheckPage />} />
          </Route>

          {/* Checkout */}
          <Route path="/checkout" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CheckoutPage />} />
          </Route>

          {/* Profile (accessible in any dashboard) */}
          <Route path="/profile" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ProfilePage />} />
          </Route>
          <Route path="/notifications" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
