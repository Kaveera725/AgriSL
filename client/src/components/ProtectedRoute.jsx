// Guards a route by role. Redirects to /login when unauthenticated, shows 403 when
// the authenticated user's role is not in allowedRoles, and blocks unapproved officers.
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Centered({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      {children}
    </Box>
  );
}

export default function ProtectedRoute({ element, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Wait for the mount-time session restore before deciding.
  if (loading) {
    return (
      <Centered>
        <CircularProgress color="primary" />
      </Centered>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Officers awaiting approval can authenticate but cannot access protected areas.
  if (user.role === 'officer' && user.is_approved === 0) {
    return (
      <Centered>
        <Typography variant="h5" color="secondary">
          Account pending approval
        </Typography>
        <Typography color="text.secondary">
          Your officer account is awaiting admin approval. Please check back later.
        </Typography>
      </Centered>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Centered>
        <Typography variant="h3" color="error">
          403
        </Typography>
        <Typography variant="h6">Access denied</Typography>
        <Typography color="text.secondary">
          You do not have permission to view this page.
        </Typography>
      </Centered>
    );
  }

  return element;
}
