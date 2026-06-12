import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Toolbar,
  Typography,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import BugReportIcon from '@mui/icons-material/BugReport';
import ChatIcon from '@mui/icons-material/Chat';
import ArticleIcon from '@mui/icons-material/Article';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = { admin: '/admin', officer: '/officer/dashboard', farmer: '/dashboard' };

const FEATURES = [
  {
    icon: <BugReportIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
    title: 'Disease Detection',
    desc: 'Upload a photo of your crop and get instant AI-powered disease diagnosis with treatment advice in Sinhala or English.',
  },
  {
    icon: <ChatIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
    title: 'AI Crop Advisor',
    desc: 'Chat with our AI assistant for personalised crop management, planting schedules, and pest control guidance.',
    link: '/chatbot',
    action: 'Open Chatbot',
  },
  {
    icon: <ArticleIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
    title: 'Advisory Articles',
    desc: 'Access verified guidance published by agricultural officers covering seasonal planting, market advice, and more.',
  },
];

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <AgricultureIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            AgriSL
          </Typography>
          {isAuthenticated ? (
            <>
              <Button component={RouterLink} to="/chatbot" color="inherit" sx={{ mr: 1 }}>
                Chatbot
              </Button>
              <Button
                component={RouterLink}
                to={ROLE_HOME[user.role] || '/dashboard'}
                color="inherit"
                sx={{ mr: 1 }}
              >
                Dashboard
              </Button>
              <Button color="inherit" variant="outlined" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit" sx={{ mr: 1 }}>
                Sign In
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                color="inherit"
                variant="outlined"
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: '#fff',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          px: 2,
        }}
      >
        <AgricultureIcon sx={{ fontSize: 72, mb: 2, opacity: 0.9 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Smart Farming for Sri Lanka
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.85, mb: 4, maxWidth: 560, mx: 'auto' }}>
          AI-powered crop disease detection, expert advisory articles, and personalised
          farming advice — available in Sinhala and English.
        </Typography>
        {!isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
              sx={{ borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Sign In
            </Button>
          </Box>
        )}
        {isAuthenticated && (
          <Button
            component={RouterLink}
            to={ROLE_HOME[user.role] || '/dashboard'}
            variant="contained"
            size="large"
            sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            Go to Dashboard
          </Button>
        )}
      </Box>

      {/* Features */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 6, color: 'primary.main' }}>
          What AgriSL Offers
        </Typography>
        <Grid container spacing={4}>
          {FEATURES.map((f) => (
            <Grid size={{ xs: 12, md: 4 }} key={f.title}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6 },
                }}
              >
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  {f.icon}
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                    {f.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {f.desc}
                  </Typography>
                </CardContent>
                {f.link && (
                  <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button
                      component={RouterLink}
                      to={f.link}
                      variant="contained"
                      color="primary"
                    >
                      {f.action}
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Who is it for */}
      <Box sx={{ bgcolor: 'grey.100', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="sm">
          <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 4, color: 'primary.main' }}>
            Built for Everyone in Agriculture
          </Typography>
          <Grid container spacing={3}>
            {[
              { role: 'Farmers', desc: 'Diagnose crop diseases, chat with the AI advisor, and read expert articles tailored to your district.' },
              { role: 'Agricultural Officers', desc: 'Publish advisory articles, review disease reports from farmers, and support your district.' },
              { role: 'Administrators', desc: 'Manage user accounts, approve officer registrations, and oversee platform activity.' },
            ].map((r) => (
              <Grid size={12} key={r.role}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <AgricultureIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {r.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          bgcolor: 'primary.main',
          color: '#fff',
          py: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          © {new Date().getFullYear()} AgriSL — Smart Agriculture for Sri Lanka
        </Typography>
      </Box>
    </Box>
  );
}
