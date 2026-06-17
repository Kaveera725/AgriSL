// Public landing page — hero banner, stats bar, feature cards, how-it-works steps,
// and footer. Accessible without login; CTAs adapt for authenticated users.
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArticleIcon from '@mui/icons-material/Article';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import { useAuth } from '../context/AuthContext';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

const ROLE_HOME = { admin: '/admin', officer: '/officer/dashboard', farmer: '/dashboard' };

const STATS = [
  { value: '10,000+', label: 'Farmers' },
  { value: '25', label: 'Districts' },
  { value: '3', label: 'Languages Supported' },
];

const FEATURES = [
  {
    icon: <EnergySavingsLeafIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'AI Farming Advisor',
    titleSi: 'AI ගොවි උපදේශක',
    desc: 'Chat with our AI assistant for personalised crop management, planting schedules, and pest control guidance — in Sinhala or English.',
    link: '/chatbot',
  },
  {
    icon: <PhotoCameraIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Crop Disease Detection',
    titleSi: 'බෝග රෝග හඳුනාගැනීම',
    desc: 'Upload a photo of your crop and get an instant AI-powered disease diagnosis with bilingual treatment advice.',
    link: '/disease',
  },
  {
    icon: <ArticleIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Expert Advisory',
    titleSi: 'විශේෂඥ උපදෙස්',
    desc: 'Read verified articles published by agricultural officers covering seasonal planting, market advice, and more.',
    link: '/advisory',
  },
];

const STEPS = [
  {
    icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
    title: 'Create your account',
    desc: 'Register for free as a farmer and set your district for tailored advice.',
  },
  {
    icon: <QuestionAnswerIcon sx={{ fontSize: 40 }} />,
    title: 'Ask or upload',
    desc: 'Chat with the AI advisor or upload a crop photo to detect diseases.',
  },
  {
    icon: <AgricultureOutlinedIcon sx={{ fontSize: 40 }} />,
    title: 'Grow better',
    desc: 'Apply expert, localised guidance to improve your yield season after season.',
  },
];

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const dashboard = user ? ROLE_HOME[user.role] || '/dashboard' : '/dashboard';

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
              <Button component={RouterLink} to={dashboard} color="inherit" sx={{ mr: 1 }}>
                Dashboard
              </Button>
              <Button color="inherit" variant="outlined" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit" sx={{ mr: 1 }}>
                Login
              </Button>
              <Button component={RouterLink} to="/register" color="inherit" variant="outlined">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: '#fff',
          py: { xs: 9, md: 14 },
          px: 2,
          textAlign: 'center',
        }}
      >
        <AgricultureIcon sx={{ fontSize: 72, mb: 2, opacity: 0.95 }} />
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, letterSpacing: 1 }}>
          AgriSL
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 500 }}>
          Bilingual Farming Support Platform
        </Typography>
        <Typography
          variant="h6"
          sx={{ opacity: 0.9, fontWeight: 500, mb: 4, fontFamily: BILINGUAL_FONT }}
        >
          ද්විභාෂා කෘෂිකාර්මික සහාය වේදිකාව
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          {isAuthenticated ? (
            <Button
              component={RouterLink}
              to={dashboard}
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#fff',
                color: 'primary.main',
                fontWeight: 700,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#fff',
                color: 'primary.main',
                fontWeight: 700,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Get Started Free
            </Button>
          )}
          <Button
            component={RouterLink}
            to="/advisory"
            variant="outlined"
            size="large"
            sx={{
              borderColor: '#fff',
              color: '#fff',
              fontWeight: 700,
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            Browse Advisory
          </Button>
        </Stack>
      </Box>

      {/* Stats bar */}
      <Box sx={{ bgcolor: '#388E3C', color: '#fff', py: 3 }}>
        <Container maxWidth="md">
          <Grid container spacing={2} justifyContent="center" textAlign="center">
            {STATS.map((s) => (
              <Grid size={{ xs: 12, sm: 4 }} key={s.label}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {s.value}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {s.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ fontWeight: 700, mb: 6, color: 'primary.main' }}
        >
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
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                }}
              >
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  {f.icon}
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 2 }}>
                    {f.title}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main', fontFamily: BILINGUAL_FONT }}
                  >
                    {f.titleSi}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {f.desc}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button component={RouterLink} to={f.link} variant="contained" color="primary">
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it works */}
      <Box sx={{ bgcolor: 'grey.100', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 700, mb: 6, color: 'primary.main' }}
          >
            How It Works
          </Typography>
          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={step.title}>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {step.icon}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        color: '#fff',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                    >
                      {i + 1}
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{ mt: 'auto', bgcolor: 'primary.dark', color: '#fff', py: 5, px: 2 }}
      >
        <Container maxWidth="md">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AgricultureIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                AgriSL
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              <Button component={RouterLink} to="/advisory" color="inherit" size="small">
                Advisory
              </Button>
              <Button component={RouterLink} to="/login" color="inherit" size="small">
                Login
              </Button>
              <Button component={RouterLink} to="/register" color="inherit" size="small">
                Register
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.85 }}>
            Developed for Sri Lankan Farmers · © {new Date().getFullYear()} AgriSL
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
