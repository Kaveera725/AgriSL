// Root component — declares all client-side routes and wraps them in AuthProvider.
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chatbot from './pages/Chatbot';
import DiseaseDetection from './pages/DiseaseDetection';
import AdvisoryBrowse from './pages/AdvisoryBrowse';
import AdvisoryDetail from './pages/AdvisoryDetail';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import ArticleEditor from './pages/officer/ArticleEditor';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import SessionView from './pages/chatbot/SessionView';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

const ROLE_HOME = { admin: '/admin', officer: '/officer/dashboard', farmer: '/dashboard' };

// Wraps guest-only pages (login/register). Already-authenticated users are sent
// to their role's home instead of seeing the auth forms again.
function GuestOnly({ element }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
  }
  return element;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GuestOnly element={<Login />} />} />
        <Route path="/register" element={<GuestOnly element={<Register />} />} />
        {/* Public advisory portal */}
        <Route path="/advisory" element={<AdvisoryBrowse />} />
        <Route path="/advisory/:id" element={<AdvisoryDetail />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={['farmer', 'admin']}
              element={<FarmerDashboard />}
            />
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute
              allowedRoles={['farmer', 'admin']}
              element={<Chatbot />}
            />
          }
        />
        <Route
          path="/chatbot/session/:id"
          element={
            <ProtectedRoute
              allowedRoles={['farmer', 'admin']}
              element={<SessionView />}
            />
          }
        />
        <Route
          path="/disease"
          element={
            <ProtectedRoute
              allowedRoles={['farmer', 'admin']}
              element={<DiseaseDetection />}
            />
          }
        />
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={['officer', 'admin']}
              element={<OfficerDashboard />}
            />
          }
        />
        <Route
          path="/officer/articles/new"
          element={
            <ProtectedRoute
              allowedRoles={['officer', 'admin']}
              element={<ArticleEditor />}
            />
          }
        />
        <Route
          path="/officer/articles/:id/edit"
          element={
            <ProtectedRoute
              allowedRoles={['officer', 'admin']}
              element={<ArticleEditor />}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={['admin']}
              element={<AdminDashboard />}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
