// 404 catch-all page — branded "page not found" notice in English + Sinhala
// with a button back to the home page.
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import HomeIcon from '@mui/icons-material/Home';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1,
        p: 3,
        bgcolor: 'grey.50',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main', mb: 1 }}>
        <AgricultureIcon sx={{ fontSize: 40 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          AgriSL
        </Typography>
      </Stack>

      <Typography variant="h1" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
        Page not found
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ fontFamily: BILINGUAL_FONT }}>
        පිටුව හමු නොවීය
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, mt: 1 }}>
        The page you are looking for doesn&apos;t exist or may have been moved.
      </Typography>

      <Button
        component={RouterLink}
        to="/"
        variant="contained"
        color="primary"
        size="large"
        startIcon={<HomeIcon />}
        sx={{ mt: 3 }}
      >
        Back to Home
      </Button>
    </Box>
  );
}
