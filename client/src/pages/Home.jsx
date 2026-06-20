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
  Toolbar,
  Typography,
} from '@mui/material';
import { Grid, Stack } from '../components/muiSystem';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArticleIcon from '@mui/icons-material/Article';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

const ROLE_HOME = { admin: '/admin', officer: '/officer/dashboard', farmer: '/dashboard' };

// Stats, features and steps reference i18n keys so their text follows the global
// English/Sinhala toggle; only the icons, values and links are static here.
const STATS = [
  { value: '10,000+', labelKey: 'home.statFarmers' },
  { value: '25', labelKey: 'home.statDistricts' },
  { value: '2', labelKey: 'home.statLanguages' },
];

const FEATURES = [
  {
    icon: <EnergySavingsLeafIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    titleKey: 'home.featureChatTitle',
    descKey: 'home.featureChatDesc',
    link: '/chatbot',
  },
  {
    icon: <PhotoCameraIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    titleKey: 'home.featureDiseaseTitle',
    descKey: 'home.featureDiseaseDesc',
    link: '/disease',
  },
  {
    icon: <ArticleIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    titleKey: 'home.featureAdvisoryTitle',
    descKey: 'home.featureAdvisoryDesc',
    link: '/advisory',
  },
];

const STEPS = [
  { icon: <PersonAddIcon sx={{ fontSize: 40 }} />, titleKey: 'home.step1Title', descKey: 'home.step1Desc' },
  { icon: <QuestionAnswerIcon sx={{ fontSize: 40 }} />, titleKey: 'home.step2Title', descKey: 'home.step2Desc' },
  { icon: <AgricultureOutlinedIcon sx={{ fontSize: 40 }} />, titleKey: 'home.step3Title', descKey: 'home.step3Desc' },
];

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
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
              <Button
                component={RouterLink}
                to={dashboard}
                color="inherit"
                sx={{ mr: 1, fontFamily: BILINGUAL_FONT }}
              >
                {t('nav.dashboard')}
              </Button>
              <Button color="inherit" variant="outlined" onClick={logout} sx={{ fontFamily: BILINGUAL_FONT }}>
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                sx={{ mr: 1, fontFamily: BILINGUAL_FONT }}
              >
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
        <Typography
          variant="h6"
          sx={{ opacity: 0.95, fontWeight: 500, mb: 4, fontFamily: BILINGUAL_FONT }}
        >
          {t('home.tagline')}
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
                fontFamily: BILINGUAL_FONT,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {t('common.goToDashboard')}
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
                fontFamily: BILINGUAL_FONT,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {t('common.getStarted')}
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
              fontFamily: BILINGUAL_FONT,
              '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            {t('common.browseAdvisory')}
          </Button>
        </Stack>
      </Box>

      {/* Stats bar */}
      <Box sx={{ bgcolor: '#388E3C', color: '#fff', py: 3 }}>
        <Container maxWidth="md">
          <Grid container spacing={2} justifyContent="center" sx={{ textAlign: 'center' }}>
            {STATS.map((s) => (
              <Grid size={{ xs: 12, sm: 4 }} key={s.labelKey}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {s.value}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontFamily: BILINGUAL_FONT }}>
                  {t(s.labelKey)}
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
          sx={{ fontWeight: 700, mb: 6, color: 'primary.main', fontFamily: BILINGUAL_FONT }}
        >
          {t('home.offers')}
        </Typography>
        <Grid container spacing={4}>
          {FEATURES.map((f) => (
            <Grid size={{ xs: 12, md: 4 }} key={f.titleKey}>
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
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mt: 2, mb: 1.5, fontFamily: BILINGUAL_FONT }}
                  >
                    {t(f.titleKey)}
                  </Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ fontFamily: BILINGUAL_FONT }}>
                    {t(f.descKey)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    component={RouterLink}
                    to={f.link}
                    variant="contained"
                    color="primary"
                    sx={{ fontFamily: BILINGUAL_FONT }}
                  >
                    {t('common.learnMore')}
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
            sx={{ fontWeight: 700, mb: 6, color: 'primary.main', fontFamily: BILINGUAL_FONT }}
          >
            {t('home.howItWorks')}
          </Typography>
          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={step.titleKey}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontFamily: BILINGUAL_FONT }}>
                    {t(step.titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: BILINGUAL_FONT }}>
                    {t(step.descKey)}
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
              <Button
                component={RouterLink}
                to="/advisory"
                color="inherit"
                size="small"
                sx={{ fontFamily: BILINGUAL_FONT }}
              >
                {t('nav.advisory')}
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                size="small"
                sx={{ fontFamily: BILINGUAL_FONT }}
              >
                {t('nav.login')}
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                color="inherit"
                size="small"
                sx={{ fontFamily: BILINGUAL_FONT }}
              >
                {t('nav.register')}
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.85, fontFamily: BILINGUAL_FONT }}>
            {t('home.footerTagline')} · © {new Date().getFullYear()} AgriSL
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
