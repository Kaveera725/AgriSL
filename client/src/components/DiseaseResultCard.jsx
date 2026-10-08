import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Step,
  StepLabel,
  StepContent,
  Stepper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Box, Stack } from './muiSystem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ShareIcon from '@mui/icons-material/Share';
import RefreshIcon from '@mui/icons-material/Refresh';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VerifiedIcon from '@mui/icons-material/Verified';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";

const CONFIDENCE_COLORS = {
  High: 'success',
  Medium: 'warning',
  Low: 'error',
};

const DANGER_COLORS = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

const RECOVERY_COLORS = {
  Good: 'success',
  Fair: 'warning',
  Poor: 'error',
};

export default function DiseaseResultCard({
  aiResult,
  mlResult,
  imageUrl,
  loading = false,
  error = null,
  onShare,
  onReset,
  showActions = true,
}) {
  const [lang, setLang] = useState('en');

  // Loading skeleton view
  if (loading) {
    return (
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <Skeleton variant="rectangular" height={220} />
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Skeleton variant="text" height={40} width="60%" sx={{ mx: 'auto' }} />
            <Skeleton variant="text" height={28} width="40%" sx={{ mx: 'auto' }} />
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
              <Skeleton variant="rounded" width={100} height={32} />
              <Skeleton variant="rounded" width={100} height={32} />
            </Stack>
            <Skeleton variant="rounded" height={60} />
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={80} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="error">
          <AlertTitle sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 700 }}>
            {lang === 'en' ? 'Diagnosis Error' : 'රෝග විනිශ්චය දෝෂයකි'}
          </AlertTitle>
          {error}
        </Alert>
        {onReset && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onReset}
            sx={{ mt: 2, fontFamily: BILINGUAL_FONT }}
          >
            {lang === 'en' ? 'Try Again' : 'නැවත උත්සාහ කරන්න'}
          </Button>
        )}
      </Card>
    );
  }

  if (!aiResult) return null;

  // Normalize data with fallback for legacy formats
  const isHealthy =
    aiResult.disease_name_en === 'No disease detected' ||
    aiResult.disease_name === 'No disease detected';

  const diseaseNameEn = aiResult.disease_name_en || aiResult.disease_name || 'Unknown Condition';
  const diseaseNameSi = aiResult.disease_name_si || diseaseNameEn;
  const scientificName = aiResult.scientific_name || 'N/A';
  const confidence = aiResult.confidence || aiResult.confidence_level || 'Medium';
  const dangerLevel = aiResult.danger_level || (isHealthy ? 'Low' : 'Medium');
  const mlAgrees = aiResult.ml_agrees ?? true;

  // Cause & why it spread
  const causeText =
    aiResult.cause?.[lang] ||
    (lang === 'en'
      ? aiResult.cause_en || aiResult.cause || (isHealthy ? 'Plant appears healthy.' : 'Pathogen infection.')
      : aiResult.cause_si || (isHealthy ? 'ශාකය සෞඛ්‍ය සම්පන්නව පෙනේ.' : 'රෝග කාරක ආසාදනයකි.'));

  const whyItSpreadText =
    aiResult.why_it_spread?.[lang] ||
    (lang === 'en'
      ? aiResult.why_it_spread_en || (isHealthy ? 'Good field conditions.' : 'Favorable environmental conditions.')
      : aiResult.why_it_spread_si || (isHealthy ? 'හොඳ ක්ෂේත්‍ර තත්වයන්.' : 'පරිසර සාධක රෝගය වර්ධනයට බලපා ඇත.'));

  // Danger explanation
  const dangerExplanation =
    aiResult.danger_explanation?.[lang] ||
    (lang === 'en'
      ? aiResult.danger_explanation_en || ''
      : aiResult.danger_explanation_si || '');

  // Visible symptoms
  let symptomsList = [];
  if (aiResult.visible_symptoms?.[lang] && Array.isArray(aiResult.visible_symptoms[lang])) {
    symptomsList = aiResult.visible_symptoms[lang];
  } else if (lang === 'en' && Array.isArray(aiResult.visible_symptoms?.en)) {
    symptomsList = aiResult.visible_symptoms.en;
  } else if (lang === 'si' && Array.isArray(aiResult.visible_symptoms?.si)) {
    symptomsList = aiResult.visible_symptoms.si;
  } else {
    const rawSymptoms = lang === 'en'
      ? (aiResult.symptoms_en || aiResult.symptoms || '')
      : (aiResult.symptoms_si || aiResult.symptoms || '');
    if (rawSymptoms) {
      symptomsList = rawSymptoms.split(/[,.\n]+/).map((s) => s.trim()).filter(Boolean);
    }
  }

  // Immediate action
  const immediateActionText =
    aiResult.immediate_action?.[lang] ||
    (lang === 'en'
      ? aiResult.immediate_action_en || (isHealthy ? 'No immediate action required. Continue routine care.' : 'Isolate infected plants and avoid overhead watering.')
      : aiResult.immediate_action_si || (isHealthy ? 'ක්ෂණික ක්‍රියාමාර්ගයක් අවශ්‍ය නොවේ. සාමාන්‍ය බෝග සත්කාරය කරගෙන යන්න.' : 'ආසාදිත පත්‍ර ඉවත් කර නිසි පරිදි විනාශ කරන්න.'));

  // Treatment array
  let treatmentSteps = [];
  if (Array.isArray(aiResult.treatment) && aiResult.treatment.length > 0) {
    treatmentSteps = aiResult.treatment;
  } else if (aiResult.treatment_en || aiResult.treatment_si) {
    treatmentSteps = [
      {
        step: 1,
        action_en: aiResult.treatment_en || 'Consult an agricultural officer.',
        action_si: aiResult.treatment_si || 'කෘෂිකර්ම නිලධාරියෙකු හමුවන්න.',
        chemical_en: 'Recommended fungicide / pesticide',
        chemical_si: 'නිර්දේශිත දිලීර නාශක / කෘමිනාශක',
        dose_en: 'As prescribed by officer',
        dose_si: 'නිලධාරියාගේ උපදෙස් පරිදි',
        when_en: 'Early morning or late afternoon',
        when_si: 'උදෑසන හෝ සවස් කාලයේ',
      },
    ];
  }

  // What to avoid
  let whatToAvoidList = [];
  if (aiResult.what_to_avoid?.[lang] && Array.isArray(aiResult.what_to_avoid[lang])) {
    whatToAvoidList = aiResult.what_to_avoid[lang];
  } else if (lang === 'en' && Array.isArray(aiResult.what_to_avoid?.en)) {
    whatToAvoidList = aiResult.what_to_avoid.en;
  } else if (lang === 'si' && Array.isArray(aiResult.what_to_avoid?.si)) {
    whatToAvoidList = aiResult.what_to_avoid.si;
  }

  // Prevention next season
  const preventionText =
    aiResult.prevention_next_season?.[lang] ||
    (lang === 'en'
      ? aiResult.prevention_next_season_en || 'Practice crop rotation and use disease-free certified seeds.'
      : aiResult.prevention_next_season_si || 'බෝග මාරුව අනුගමනය කරන්න සහ සහතික කළ නිරෝගී බීජ භාවිත කරන්න.');

  // Recovery chance
  const recoveryLevel = aiResult.recovery_chance?.level || (isHealthy ? 'Good' : 'Fair');
  const recoveryText =
    aiResult.recovery_chance?.[lang] ||
    (typeof aiResult.recovery_chance === 'string'
      ? aiResult.recovery_chance
      : lang === 'en'
      ? aiResult.recovery_chance?.en || (isHealthy ? 'Plant is in good health.' : 'Good recovery chance if treated early.')
      : aiResult.recovery_chance?.si || (isHealthy ? 'ශාකය හොඳ සෞඛ්‍ය තත්ත්වයක පවතී.' : 'කාලෝචිත ලෙස ප්‍රතිකාර කළහොත් සුව වීමේ ඉහළ සම්භාවිතාවක් ඇත.'));

  // When to call officer
  const callOfficerText =
    aiResult.when_to_call_officer?.[lang] ||
    (lang === 'en'
      ? aiResult.when_to_call_officer_en || 'Contact your agricultural officer if symptoms worsen within 7 days.'
      : aiResult.when_to_call_officer_si || 'දින 7ක් ඇතුළත රෝග ලක්ෂණ උත්සන්න වුවහොත් කෘෂිකර්ම නිලධාරියා අමතන්න.');

  // Disclaimer
  const disclaimerText =
    lang === 'en'
      ? aiResult.disclaimer_en || 'This diagnosis is generated by AI based on the photo. Always confirm with a qualified agricultural officer.'
      : aiResult.disclaimer_si || 'මෙය AI ආධාරිත රෝග විනිශ්චයකි. රසායනික ද්‍රව්‍ය මිලදී ගැනීමට පෙර සෑම විටම සුදුසුකම් ලත් කෘෂිකර්ම නිලධාරියෙකු සමඟ සත්‍යාපනය කරන්න.';

  const isSi = lang === 'si';
  const fontStyle = isSi ? { fontFamily: BILINGUAL_FONT } : {};

  return (
    <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Uploaded image */}
      {imageUrl && (
        <CardMedia
          component="img"
          image={imageUrl}
          alt={diseaseNameEn}
          sx={{ maxHeight: 260, objectFit: 'cover', width: '100%' }}
        />
      )}

      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* ========================================================
            SECTION 1 — Disease Header
            ======================================================== */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isHealthy ? 'success.main' : 'error.main',
              letterSpacing: '-0.02em',
            }}
          >
            {diseaseNameEn}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: isHealthy ? 'success.dark' : 'error.dark',
              fontFamily: BILINGUAL_FONT,
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            {diseaseNameSi}
          </Typography>
          {scientificName && scientificName !== 'N/A' && (
            <Typography
              variant="body2"
              sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.25 }}
            >
              {scientificName}
            </Typography>
          )}

          {/* Badges */}
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 1.5 }}
          >
            <Chip
              label={`Confidence: ${confidence}`}
              color={CONFIDENCE_COLORS[confidence] || 'default'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={`Danger: ${dangerLevel}`}
              color={DANGER_COLORS[dangerLevel] || 'default'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            {mlAgrees && (
              <Chip
                icon={<VerifiedIcon />}
                label={lang === 'en' ? 'ML Model Confirmed' : 'ML ආකෘතිය සනාථ කළේය'}
                color="info"
                variant="outlined"
                size="small"
                sx={{ ...fontStyle, fontWeight: 500 }}
              />
            )}
            {mlResult?.className && (
              <Chip
                label={`ML: ${mlResult.className}${mlResult.confidence != null ? ` (${mlResult.confidence}%)` : ''}`}
                variant="outlined"
                size="small"
                sx={{ fontFamily: BILINGUAL_FONT }}
              />
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* ========================================================
            SECTION 2 — Language Toggle
            ======================================================== */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={lang}
            exclusive
            onChange={(_, val) => val && setLang(val)}
            size="small"
            color="primary"
          >
            <ToggleButton value="en" sx={{ px: 2.5, fontWeight: 600 }}>
              English
            </ToggleButton>
            <ToggleButton
              value="si"
              sx={{ px: 2.5, fontFamily: BILINGUAL_FONT, fontWeight: 600 }}
            >
              සිංහල
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ========================================================
            SECTION 5 — Do This NOW (Alert with warning color)
            Always visible before treatment details
            ======================================================== */}
        <Alert
          severity="warning"
          icon={<AccessTimeIcon fontSize="inherit" />}
          sx={{ mb: 2.5, borderRadius: 1.5, ...fontStyle }}
        >
          <AlertTitle sx={{ fontWeight: 700, ...fontStyle }}>
            {isSi ? 'දැන්ම කළ යුතු දේ' : 'Do this immediately'}
          </AlertTitle>
          <Typography variant="body2" sx={fontStyle}>
            {immediateActionText}
          </Typography>
        </Alert>

        {/* ========================================================
            SECTION 3 — Why It Happened (Accordion, expanded default)
            ======================================================== */}
        <Accordion defaultExpanded sx={{ mb: 1.5, borderRadius: 1.5, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 700, ...fontStyle }}>
              {isSi ? 'මෙය ඇතිවූ හේතුව' : 'Why did this happen?'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: whyItSpreadText ? 1.5 : 0, ...fontStyle }}>
              {causeText}
            </Typography>
            {whyItSpreadText && (
              <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5, ...fontStyle }}>
                  {isSi ? 'තත්වය වඩාත් නරක අතට හැරවූ කරුණු:' : 'What made it worse:'}
                </Typography>
                <Typography variant="body2" sx={fontStyle}>
                  {whyItSpreadText}
                </Typography>
              </Box>
            )}
            {dangerExplanation && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block', mb: 0.5, ...fontStyle }}>
                  {isSi ? 'අවදානම් පැහැදිලි කිරීම:' : 'Risk Assessment:'}
                </Typography>
                <Typography variant="body2" sx={fontStyle}>
                  {dangerExplanation}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* ========================================================
            SECTION 4 — What You Can See (Accordion)
            ======================================================== */}
        <Accordion sx={{ mb: 1.5, borderRadius: 1.5, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 700, ...fontStyle }}>
              {isSi ? 'ශාකයේ රෝග ලක්ෂණ' : 'Symptoms on your plant'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {symptomsList.length > 0 ? (
              <List dense disablePadding>
                {symptomsList.map((sym, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={sym}
                      primaryTypographyProps={{ variant: 'body2', ...fontStyle }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={fontStyle}>
                {isSi ? 'රෝග ලක්ෂණ වාර්තා වී නොමැත.' : 'No visible symptoms detected.'}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* ========================================================
            SECTION 6 — Treatment Steps (MUI Stepper, vertical)
            ======================================================== */}
        <Box sx={{ my: 2.5, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, ...fontStyle }}>
            {isSi ? 'ප්‍රතිකාර සැලැස්ම' : 'Treatment Plan'}
          </Typography>

          {treatmentSteps.length === 0 || isHealthy ? (
            <Alert severity="success" sx={{ ...fontStyle }}>
              {isSi
                ? 'ශාකය නිරෝගී බැවින් කිසිදු රසායනික ප්‍රතිකාරයක් අවශ්‍ය නොවේ. සාමාන්‍ය බෝග කළමනාකරණය කරගෙන යන්න.'
                : 'No chemical treatment required. The plant is healthy — continue regular crop maintenance.'}
            </Alert>
          ) : (
            <Stepper orientation="vertical" activeStep={-1}>
              {treatmentSteps.map((step, idx) => {
                const action = isSi ? step.action_si || step.action_en : step.action_en;
                const chemical = isSi ? step.chemical_si || step.chemical_en : step.chemical_en;
                const dose = isSi ? step.dose_si || step.dose_en : step.dose_en;
                const when = isSi ? step.when_si || step.when_en : step.when_en;

                return (
                  <Step key={idx} active expanded>
                    <StepLabel>
                      <Typography sx={{ fontWeight: 600, ...fontStyle }}>
                        {isSi ? `පියවර ${step.step || idx + 1}` : `Step ${step.step || idx + 1}`}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" sx={{ mb: 1.5, ...fontStyle }}>
                        {action}
                      </Typography>

                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {chemical && (
                          <Box
                            sx={{
                              bgcolor: '#e8f5e9',
                              color: '#1b5e20',
                              border: '1px solid #a5d6a7',
                              borderRadius: 1,
                              p: 1,
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', ...fontStyle }}>
                              {isSi ? 'රසායනිකය / නිෂ්පාදනය:' : 'Chemical / Brand:'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, ...fontStyle }}>
                              {chemical}
                            </Typography>
                          </Box>
                        )}

                        {dose && (
                          <Box
                            sx={{
                              bgcolor: '#fff8e1',
                              color: '#8d6e00',
                              border: '1px solid #ffe082',
                              borderRadius: 1,
                              p: 1,
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', ...fontStyle }}>
                              {isSi ? 'මාත්‍රාව:' : 'Dosage:'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, ...fontStyle }}>
                              {dose}
                            </Typography>
                          </Box>
                        )}

                        {when && (
                          <Box
                            sx={{
                              bgcolor: '#e3f2fd',
                              color: '#0d47a1',
                              border: '1px solid #90caf9',
                              borderRadius: 1,
                              p: 1,
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', ...fontStyle }}>
                              {isSi ? 'යෙදිය යුතු වේලාව / නැවත යෙදීම:' : 'When to Apply:'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, ...fontStyle }}>
                              {when}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          )}
        </Box>

        {/* ========================================================
            SECTION 7 — What NOT To Do (Accordion)
            ======================================================== */}
        {whatToAvoidList.length > 0 && (
          <Accordion sx={{ mb: 1.5, borderRadius: 1.5, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 700, ...fontStyle }}>
                {isSi ? 'වළකින්නට ඕනේ දේ' : 'Common mistakes to avoid'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense disablePadding>
                {whatToAvoidList.map((item, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CancelIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2', ...fontStyle }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* ========================================================
            SECTION 8 — Next Season Prevention (Accordion)
            ======================================================== */}
        <Accordion sx={{ mb: 1.5, borderRadius: 1.5, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 700, ...fontStyle }}>
              {isSi ? 'ඊළඟ කන්නයේ වළකින හැටි' : 'Prevent this next season'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={fontStyle}>
              {preventionText}
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* ========================================================
            SECTION 9 — Recovery Chance (MUI Card with colored bg)
            ======================================================== */}
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 1.5,
            bgcolor:
              recoveryLevel === 'Good'
                ? '#f1f8e9'
                : recoveryLevel === 'Fair'
                ? '#fffde7'
                : '#ffebee',
            borderColor:
              recoveryLevel === 'Good'
                ? '#c8e6c9'
                : recoveryLevel === 'Fair'
                ? '#fff59d'
                : '#ffcdd2',
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <HealthAndSafetyIcon
                color={RECOVERY_COLORS[recoveryLevel] || 'default'}
                fontSize="small"
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, ...fontStyle }}>
                {isSi ? 'සුවය ලැබීමේ හැකියාව' : 'Recovery Chance'}
              </Typography>
            </Stack>
            <Chip
              label={recoveryLevel}
              color={RECOVERY_COLORS[recoveryLevel] || 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="body2" sx={fontStyle}>
            {recoveryText}
          </Typography>
        </Card>

        {/* ========================================================
            SECTION 10 — When to Call Officer (MUI Alert, info color)
            ======================================================== */}
        <Alert
          severity="info"
          icon={<PhoneInTalkIcon fontSize="inherit" />}
          sx={{ mb: 2.5, borderRadius: 1.5, ...fontStyle }}
        >
          <AlertTitle sx={{ fontWeight: 700, ...fontStyle }}>
            {isSi ? 'කෘෂිකර්ම නිලධාරියා අමතන්නේ කවදාද' : 'When to contact Agricultural Officer'}
          </AlertTitle>
          <Typography variant="body2" sx={fontStyle}>
            {callOfficerText}
          </Typography>
        </Alert>

        {/* ========================================================
            SECTION 11 — Disclaimer (red italic small text at bottom)
            ======================================================== */}
        <Typography
          variant="caption"
          align="center"
          sx={{
            display: 'block',
            color: 'error.main',
            fontStyle: 'italic',
            mb: 3,
            px: 1,
            ...fontStyle,
          }}
        >
          {disclaimerText}
        </Typography>

        {/* ========================================================
            SECTION 12 — Action Buttons
            ======================================================== */}
        {showActions && (
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              disabled
              fullWidth
              sx={{ ...fontStyle }}
            >
              {isSi ? 'උපකරණ පුවරුවට සුරැකිණි' : 'Saved to Dashboard'}
            </Button>

            {onShare && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ShareIcon />}
                fullWidth
                onClick={onShare}
                sx={{ ...fontStyle }}
              >
                {isSi
                  ? 'කෘෂිකාර්මික නිලධාරියාට යවන්න'
                  : 'Share with Agricultural Officer'}
              </Button>
            )}

            {onReset && (
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                fullWidth
                onClick={onReset}
                sx={{ ...fontStyle }}
              >
                {isSi ? 'තවත් පරීක්ෂා කරන්න' : 'Detect Another'}
              </Button>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
