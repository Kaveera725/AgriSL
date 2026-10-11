import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import api from '../api/axios';

const BILINGUAL_FONT = "'Noto Sans Sinhala', Roboto, sans-serif";
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const OFFICER_DESIGNATIONS = [
  'Agricultural Instructor',
  'Field Officer',
  'Agricultural Research Officer',
  'Extension Officer',
  'Regional Agricultural Officer',
  'Other',
];

const PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
];

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'inherit' };
  if (pwd.length < 8) return { score: 25, label: 'Weak (Under 8 characters)', color: 'error.main' };

  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /[0-9]/.test(pwd);
  const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);

  if (hasLetters && hasNumbers && hasSymbols) {
    return { score: 100, label: 'Strong (Letters, numbers & symbols)', color: 'success.main' };
  } else if ((hasLetters && hasNumbers) || (hasLetters && hasSymbols) || (hasNumbers && hasSymbols)) {
    return { score: 65, label: 'Medium (Mixed characters)', color: 'warning.main' };
  } else {
    return { score: 30, label: 'Weak (Only letters or numbers)', color: 'error.main' };
  }
}

export default function EditProfileModal({ open, onClose, user, onSuccess }) {
  const [tabIndex, setTabIndex] = useState(0);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [district, setDistrict] = useState('');
  const [designation, setDesignation] = useState('');
  const [province, setProvince] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Status & feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Sync state with incoming user prop when opened
  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setPreferredLanguage(user.preferred_language || 'en');
      setDistrict(user.district || '');
      setDesignation(user.designation || '');
      setProvince(user.province || '');
      setEmail(user.email || '');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setErrorMsg('');
      setTabIndex(0);
    }
  }, [open, user]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      setErrorMsg('Only JPG, PNG, or WEBP images accepted');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Profile photo must be 2MB or less');
      return;
    }

    setErrorMsg('');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setErrorMsg('');

    // Client-side validations
    if (!name || name.trim().length < 2) {
      setErrorMsg('Name must be at least 2 characters');
      setTabIndex(0);
      return;
    }

    const phoneRegex = /^(\+94|0)[0-9]{9}$/;
    if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
      setErrorMsg('Invalid phone number. Use format: 0771234567 or +94771234567');
      setTabIndex(0);
      return;
    }

    if (user?.role === 'farmer' && !district) {
      setErrorMsg('District is required');
      setTabIndex(0);
      return;
    }

    // Admin email change
    const emailChanged = user?.role === 'admin' && email.trim().toLowerCase() !== (user.email || '').toLowerCase();
    if (emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMsg('Invalid email address');
        return;
      }
      if (!currentPassword) {
        setErrorMsg('Current password required to change email (enter in Security tab)');
        setTabIndex(1);
        return;
      }
    }

    // Password change validation
    const wantsPasswordChange = Boolean(newPassword || confirmPassword);
    if (wantsPasswordChange) {
      if (!currentPassword) {
        setErrorMsg('Current password required to set a new password');
        setTabIndex(1);
        return;
      }
      if (newPassword.length < 8) {
        setErrorMsg('New password must be at least 8 characters');
        setTabIndex(1);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirm password do not match');
        setTabIndex(1);
        return;
      }
    }

    // Build FormData
    const formData = new FormData();
    let hasChanges = false;

    // Name
    if (name.trim() !== (user?.name || '').trim()) {
      formData.append('name', name.trim());
      hasChanges = true;
    }

    // Phone
    const cleanPhone = phone.trim();
    const origPhone = (user?.phone || '').trim();
    if (cleanPhone !== origPhone) {
      formData.append('phone', cleanPhone);
      hasChanges = true;
    }

    // Preferred language
    if (preferredLanguage !== (user?.preferred_language || 'en')) {
      formData.append('preferred_language', preferredLanguage);
      hasChanges = true;
    }

    // Photo
    if (photoFile) {
      formData.append('profile_photo', photoFile);
      hasChanges = true;
    }

    // Farmer role
    if (user?.role === 'farmer') {
      if (district !== (user?.district || '')) {
        formData.append('district', district);
        hasChanges = true;
      }
    }

    // Officer role
    if (user?.role === 'officer') {
      if (district !== (user?.district || '')) {
        formData.append('district', district);
        hasChanges = true;
      }
      if (designation !== (user?.designation || '')) {
        formData.append('designation', designation);
        hasChanges = true;
      }
      if (province !== (user?.province || '')) {
        formData.append('province', province);
        hasChanges = true;
      }
    }

    // Admin role email change
    if (emailChanged) {
      formData.append('email', email.trim().toLowerCase());
      formData.append('current_password', currentPassword);
      hasChanges = true;
    }

    // Password change
    if (wantsPasswordChange) {
      formData.append('current_password', currentPassword);
      formData.append('new_password', newPassword);
      formData.append('confirm_password', confirmPassword);
      hasChanges = true;
    }

    if (!hasChanges) {
      setErrorMsg('No changes were made to save');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data.user;
      setSnackbarOpen(true);
      if (onSuccess) {
        onSuccess(updatedUser);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentPhotoSrc = photoPreview || (user?.profile_photo
    ? `${API_BASE.replace('/api', '')}/uploads/profiles/${user.profile_photo}`
    : (user?.profile_picture ? `${API_BASE.replace('/api', '')}/uploads/${user.profile_picture}` : undefined));

  const pwdStrength = getPasswordStrength(newPassword);

  return (
    <>
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ fontFamily: BILINGUAL_FONT, fontWeight: 700, pb: 1 }}>
          Edit Profile / පැතිකඩ සංස්කරණය කරන්න
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            sx={{ '& .MuiTab-root': { fontFamily: BILINGUAL_FONT, fontWeight: 600 } }}
          >
            <Tab label="Profile" />
            <Tab label="Security" />
          </Tabs>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, fontFamily: BILINGUAL_FONT }}>
              {errorMsg}
            </Alert>
          )}

          {/* ===================== PROFILE TAB ===================== */}
          {tabIndex === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Profile Photo Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                  <Avatar
                    src={currentPhotoSrc}
                    sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main' }}
                  >
                    {!currentPhotoSrc && user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <IconButton
                    size="small"
                    aria-label="Upload profile photo"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      bgcolor: 'background.paper',
                      border: '1px solid #ccc',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" color="primary" />
                  </IconButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handlePhotoSelect}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Profile Photo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG or WEBP. Max 2MB.
                  </Typography>
                  {photoFile && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                      Selected: {photoFile.name}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Full Name */}
              <TextField
                label="Full Name"
                required
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                helperText="Name must be at least 2 characters"
              />

              {/* Phone Number */}
              <TextField
                label="Phone Number / දුරකතන අංකය"
                placeholder="0771234567"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Sri Lankan format: 0771234567"
              />

              {/* Preferred Language */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, fontFamily: BILINGUAL_FONT }}>
                  Default Language / පෙරනිමි භාෂාව
                </Typography>
                <ToggleButtonGroup
                  value={preferredLanguage}
                  exclusive
                  onChange={(_, val) => val && setPreferredLanguage(val)}
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="en" sx={{ px: 3, fontWeight: 600 }}>
                    English
                  </ToggleButton>
                  <ToggleButton value="si" sx={{ px: 3, fontWeight: 600, fontFamily: BILINGUAL_FONT }}>
                    සිංහල
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* FARMER: District */}
              {user?.role === 'farmer' && (
                <FormControl fullWidth required>
                  <InputLabel id="farmer-district-label">District</InputLabel>
                  <Select
                    labelId="farmer-district-label"
                    label="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    {SL_DISTRICTS.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* OFFICER: District, Designation, Province, Gov Service ID */}
              {user?.role === 'officer' && (
                <>
                  <FormControl fullWidth>
                    <InputLabel id="officer-district-label">District</InputLabel>
                    <Select
                      labelId="officer-district-label"
                      label="District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    >
                      {SL_DISTRICTS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id="officer-designation-label">Designation</InputLabel>
                    <Select
                      labelId="officer-designation-label"
                      label="Designation"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      {OFFICER_DESIGNATIONS.map((des) => (
                        <MenuItem key={des} value={des}>
                          {des}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id="officer-province-label">Province</InputLabel>
                    <Select
                      labelId="officer-province-label"
                      label="Province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    >
                      {PROVINCES.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Government Service ID (cannot be changed)"
                    fullWidth
                    disabled
                    value={user?.gov_service_id || 'Not Assigned'}
                    helperText="Contact administrator to update your service ID"
                  />
                </>
              )}

              {/* ADMIN: Email Address info on Profile tab */}
              {user?.role === 'admin' && (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText="Changing email requires your current password (enter in Security tab)"
                  />
                  <Alert severity="warning" sx={{ mt: 1.5 }}>
                    Changing your email will update your login credentials.
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          {/* ===================== SECURITY TAB ===================== */}
          {tabIndex === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* ADMIN ONLY: Email change section at top of Security */}
              {user?.role === 'admin' && (
                <>
                  <Divider textAlign="left">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      EMAIL CHANGE
                    </Typography>
                  </Divider>
                  <TextField
                    label="Email Address"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText="Requires current password below"
                  />
                  <Alert severity="warning" sx={{ my: 0.5 }}>
                    Changing your email will update your login credentials.
                  </Alert>
                </>
              )}

              {/* Password Change Info */}
              <Alert severity="info" sx={{ fontFamily: BILINGUAL_FONT }}>
                Leave these fields empty if you do not want to change your password.
              </Alert>

              {/* Current Password */}
              <TextField
                label="Current Password / වත්මන් මුරපදය"
                type="password"
                fullWidth
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                helperText={
                  wantsPasswordChange || (user?.role === 'admin' && email !== user?.email)
                    ? 'Required to authorize changes'
                    : ''
                }
              />

              {/* New Password */}
              <Box>
                <TextField
                  label="New Password / නව මුරපදය"
                  type="password"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Minimum 8 characters"
                />
                {newPassword && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Password strength:
                      </Typography>
                      <Typography variant="caption" sx={{ color: pwdStrength.color, fontWeight: 600 }}>
                        {pwdStrength.label}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pwdStrength.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: pwdStrength.color,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Confirm New Password */}
              <TextField
                label="Confirm New Password / නව මුරපදය තහවුරු කරන්න"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={Boolean(newPassword && confirmPassword && newPassword !== confirmPassword)}
                helperText={
                  newPassword && confirmPassword && newPassword !== confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={onClose} disabled={submitting} sx={{ fontFamily: BILINGUAL_FONT }}>
            Cancel / අවලංගු කරන්න
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            sx={{ minWidth: 100, fontFamily: BILINGUAL_FONT }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Save / සුරකින්න'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message="Profile updated successfully"
      />
    </>
  );
}
