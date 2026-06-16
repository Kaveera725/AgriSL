// Top navigation bar — shows role-based links, a live notification bell (polled every
// 60 s), and the user avatar with logout. Rendered inside all authenticated pages.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BILINGUAL_FONT = 'Noto Sans Sinhala, Roboto, sans-serif';

// Navigation links shown for each role.
const NAV_LINKS = {
  farmer: [
    { label: 'Home', to: '/' },
    { label: 'Chatbot', to: '/chatbot' },
    { label: 'Disease Detection', to: '/disease' },
    { label: 'Advisory', to: '/advisory' },
  ],
  officer: [
    { label: 'Dashboard', to: '/officer/dashboard' },
    { label: 'Advisory', to: '/advisory' },
  ],
  admin: [{ label: 'Admin Panel', to: '/admin' }],
};

// Up to two initials from the user's name for the avatar.
function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

// Formats a timestamp as "Mon DD, HH:MM" for the notification popover.
function formatWhen(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const links = NAV_LINKS[user?.role] || [];

  // Called by the setInterval poll; silently keeps the last good state on failure.
  async function loadNotifications() {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Leave the last good state in place on a transient failure.
    }
  }

  // Fetch on mount, then poll every 60s for new notifications.
  useEffect(() => {
    let active = true;
    api
      .get('/notifications')
      .then(({ data }) => {
        if (!active) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      })
      .catch(() => {
        // Leave the last good state in place on a transient failure.
      });
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Optimistically marks every notification as read in local state before
  // the server confirms, so the badge clears immediately.
  async function handleMarkAll() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((list) => list.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  // Marks a single notification read when clicked. Skips the API call if
  // it is already read to avoid redundant network requests.
  async function handleItemClick(notif) {
    if (notif.is_read) return;
    try {
      await api.patch(`/notifications/${notif.id}/read`);
      setNotifications((list) =>
        list.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }

  // Clears auth state then hard-redirects to /login so stale UI is not visible.
  function handleLogout() {
    logout();
    navigate('/login');
  }

  const recent = notifications.slice(0, 10);

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        {/* Logo */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          component={RouterLink}
          to="/"
          sx={{ color: 'inherit', textDecoration: 'none', mr: 3 }}
        >
          <AgricultureIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            AgriSL
          </Typography>
        </Stack>

        {/* Role-based navigation links */}
        <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1, flexWrap: 'wrap' }}>
          {links.map((link) => (
            <Button
              key={link.to + link.label}
              component={RouterLink}
              to={link.to}
              color="inherit"
              sx={{ fontFamily: BILINGUAL_FONT }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>

        {/* Notification bell */}
        <Tooltip title="Notifications">
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { width: 360, maxWidth: '90vw' } } }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            <Button
              size="small"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </Box>
          <Divider />

          {recent.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ p: 3, textAlign: 'center' }}
              variant="body2"
            >
              No notifications yet.
            </Typography>
          ) : (
            <List disablePadding sx={{ maxHeight: 380, overflowY: 'auto' }}>
              {recent.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  sx={{
                    bgcolor: n.is_read ? 'transparent' : 'rgba(46,125,50,0.08)',
                    alignItems: 'flex-start',
                  }}
                >
                  <ListItemText
                    primary={n.message}
                    secondary={formatWhen(n.created_at)}
                    slotProps={{
                      primary: {
                        sx: {
                          fontFamily: BILINGUAL_FONT,
                          fontWeight: n.is_read ? 400 : 700,
                        },
                      },
                      secondary: { sx: { mt: 0.25 } },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Popover>

        {/* User info + logout */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: 15 }}>
            {initials(user?.name)}
          </Avatar>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
          >
            {user?.name}
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
