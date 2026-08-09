// Top navigation bar — shows role-based links with active-route highlighting, a
// responsive hamburger Drawer on mobile, a live notification bell (polled every
// 60 s when authenticated), and the user avatar with logout. Guests see Login/Register.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Stack } from './muiSystem';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

// Navigation links shown for each role. labelKey resolves via the i18n dictionary
// so link text follows the global English/Sinhala toggle.
const NAV_LINKS = {
  farmer: [
    { labelKey: 'nav.home', to: '/' },
    { labelKey: 'nav.chatbot', to: '/chatbot' },
    { labelKey: 'nav.disease', to: '/disease' },
    { labelKey: 'nav.advisory', to: '/advisory' },
  ],
  officer: [
    { labelKey: 'nav.dashboard', to: '/officer/dashboard' },
    { labelKey: 'nav.advisory', to: '/advisory' },
  ],
  admin: [{ labelKey: 'nav.adminPanel', to: '/admin' }],
};

const GUEST_LINKS = [
  { labelKey: 'nav.home', to: '/' },
  { labelKey: 'nav.advisory', to: '/advisory' },
];

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

// True when the current path matches a nav link. '/' must match exactly so it
// isn't highlighted on every nested route.
function isActive(pathname, to) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = isAuthenticated ? NAV_LINKS[user?.role] || [] : GUEST_LINKS;

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

  // Fetch on mount, then poll every 60s for new notifications (authenticated only).
  useEffect(() => {
    if (!isAuthenticated) return undefined;
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
  }, [isAuthenticated]);

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

  // Where a notification should take the user when clicked, keyed by type.
  function destinationFor(notif) {
    if (notif.type === 'new_officer_pending') return '/admin';
    return null;
  }

  // Marks a single notification read when clicked, then navigates to the relevant
  // page (e.g. admin panel for a pending-officer alert). Marking read is skipped
  // for already-read items to avoid redundant network requests.
  async function handleItemClick(notif) {
    if (!notif.is_read) {
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

    const dest = destinationFor(notif);
    if (dest) {
      setAnchorEl(null);
      navigate(dest);
    }
  }

  // Clears auth state then hard-redirects to /login so stale UI is not visible.
  function handleLogout() {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  }

  const recent = notifications.slice(0, 10);

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        {/* Mobile hamburger */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setDrawerOpen(true)}
          sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' } }}
          aria-label="Open navigation menu"
        >
          <MenuIcon />
        </IconButton>

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

        {/* Desktop navigation links */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}
        >
          {links.map((link) => {
            const active = isActive(location.pathname, link.to);
            return (
              <Button
                key={link.to + link.labelKey}
                component={RouterLink}
                to={link.to}
                color="inherit"
                sx={{
                  fontFamily: BILINGUAL_FONT,
                  fontWeight: active ? 700 : 400,
                  borderBottom: active ? '2px solid #fff' : '2px solid transparent',
                  borderRadius: 0,
                }}
              >
                {t(link.labelKey)}
              </Button>
            );
          })}
        </Stack>

        {/* Push the right-hand controls over on mobile (links are hidden there). */}
        <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

        {isAuthenticated ? (
          <>
            {/* Notification bell */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={(e) => {
                  setAnchorEl(e.currentTarget);
                  if (unreadCount > 0) handleMarkAll();
                }}
              >
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: BILINGUAL_FONT }}>
                  {t('notif.title')}
                </Typography>
                <Button
                  size="small"
                  onClick={handleMarkAll}
                  disabled={unreadCount === 0}
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  {t('notif.markAll')}
                </Button>
              </Box>
              <Divider />

              {recent.length === 0 ? (
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ p: 3, textAlign: 'center', fontFamily: BILINGUAL_FONT }}
                >
                  {t('notif.empty')}
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
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontFamily: BILINGUAL_FONT }}
              >
                {t('nav.logout')}
              </Button>
            </Stack>
          </>
        ) : (
          // Guest controls (desktop)
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button component={RouterLink} to="/login" color="inherit" sx={{ fontFamily: BILINGUAL_FONT }}>
              {t('nav.login')}
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              color="inherit"
              variant="outlined"
              sx={{ fontFamily: BILINGUAL_FONT }}
            >
              {t('nav.register')}
            </Button>
          </Stack>
        )}
      </Toolbar>

      {/* Mobile navigation drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} role="presentation">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
            <AgricultureIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              AgriSL
            </Typography>
          </Stack>
          <Divider />
          <List>
            {links.map((link) => {
              const active = isActive(location.pathname, link.to);
              return (
                <ListItemButton
                  key={link.to + link.labelKey}
                  component={RouterLink}
                  to={link.to}
                  selected={active}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText
                    primary={t(link.labelKey)}
                    slotProps={{
                      primary: { sx: { fontFamily: BILINGUAL_FONT, fontWeight: active ? 700 : 400 } },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            {isAuthenticated ? (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ fontFamily: BILINGUAL_FONT }}
              >
                {t('nav.logout')}
              </Button>
            ) : (
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  {t('nav.register')}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  component={RouterLink}
                  to="/login"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ fontFamily: BILINGUAL_FONT }}
                >
                  {t('nav.login')}
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
