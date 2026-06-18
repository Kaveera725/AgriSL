// Bilingual UI language switcher (English / සිංහල).
//
// Two modes:
//   <LanguageToggle floating />  — fixed bottom-right pill rendered once at the
//                                  app root, so it is present on every page.
//   <LanguageToggle />           — inline group for embedding inside a toolbar.
//
// Both drive the same global LanguageContext, so switching anywhere updates the
// whole interface and persists across navigation and reloads.
import { Box, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLanguage } from '../context/LanguageContext';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

export default function LanguageToggle({ floating = false, size = 'small' }) {
  const { lang, setLang } = useLanguage();

  const group = (
    <ToggleButtonGroup
      value={lang}
      exclusive
      size={size}
      color="primary"
      onChange={(_, v) => v && setLang(v)}
      aria-label="Interface language"
    >
      <ToggleButton value="en" aria-label="English" sx={{ fontWeight: 700, px: 1.5 }}>
        EN
      </ToggleButton>
      <ToggleButton
        value="si"
        aria-label="Sinhala"
        sx={{ fontWeight: 700, px: 1.5, fontFamily: BILINGUAL_FONT }}
      >
        සිං
      </ToggleButton>
    </ToggleButtonGroup>
  );

  if (!floating) return group;

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        borderRadius: 5,
        px: 1,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, color: 'primary.main' }}>
        <TranslateIcon fontSize="small" />
      </Box>
      {group}
    </Paper>
  );
}
