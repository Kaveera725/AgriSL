import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
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

// Lightweight placeholders until each area is built out.
function Placeholder({ title }) {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" color="primary">
        {title}
      </Typography>
    </Box>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
              allowedRoles={['farmer']}
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
              element={<Placeholder title="Admin Dashboard" />}
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}
