import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chatbot from './pages/Chatbot';

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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={['farmer', 'admin']}
              element={<Placeholder title="Farmer Dashboard" />}
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
          path="/officer/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={['officer', 'admin']}
              element={<Placeholder title="Officer Dashboard" />}
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
