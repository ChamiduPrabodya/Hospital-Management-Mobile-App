export const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

export const normalizeName = (name = '') => String(name).trim();

export const normalizePhone = (phone = '') => {
  const rawPhone = String(phone).trim();
  const digits = rawPhone.replace(/\D/g, '');
  return rawPhone.startsWith('+') ? `+${digits}` : digits;
};

export const normalizeAddress = (address = '') => String(address).trim();

export const normalizePassword = (password = '') => String(password).trim();

const EMAIL_MAX_LENGTH = 254;
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;
const STRONG_PASSWORD_MIN_LENGTH = 8;
const STRONG_PASSWORD_CHECKS = [
  /[A-Z]/,
  /[a-z]/,
  /\d/,
  /[^A-Za-z0-9]/,
];

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail.length <= EMAIL_MAX_LENGTH && re.test(normalizedEmail);
};

export const validatePassword = (password) => {
  return normalizePassword(password).length >= 6;
};

export const validateStrongPassword = (password) => {
  const normalizedPassword = normalizePassword(password);
  return normalizedPassword.length >= STRONG_PASSWORD_MIN_LENGTH
    && /[A-Z]/.test(normalizedPassword)
    && /[a-z]/.test(normalizedPassword)
    && /\d/.test(normalizedPassword)
    && /[^A-Za-z0-9]/.test(normalizedPassword);
};

export const getPasswordStrength = (password) => {
  const normalizedPassword = normalizePassword(password);

  if (!normalizedPassword) {
    return {
      level: 'empty',
      label: '',
      score: 0,
    };
  }

  const passedChecks = STRONG_PASSWORD_CHECKS.reduce(
    (total, pattern) => total + (pattern.test(normalizedPassword) ? 1 : 0),
    0
  );

  if (validateStrongPassword(normalizedPassword)) {
    return {
      level: 'strong',
      label: 'Strong',
      score: 3,
    };
  }

  if (normalizedPassword.length >= STRONG_PASSWORD_MIN_LENGTH && passedChecks >= 3) {
    return {
      level: 'medium',
      label: 'Medium',
      score: 2,
    };
  }

  return {
    level: 'weak',
    label: 'Weak',
    score: 1,
  };
};

export const validateOtp = (otp) => /^\d{6}$/.test(String(otp).trim());

export const validatePhone = (phone) => {
  const normalizedPhone = normalizePhone(phone);
  const digitsOnly = normalizedPhone.replace(/^\+/, '');
  return /^\+?\d+$/.test(normalizedPhone)
    && digitsOnly.length >= PHONE_MIN_DIGITS
    && digitsOnly.length <= PHONE_MAX_DIGITS;
};

const getNameError = (name) => {
  if (!name) {
    return 'Full name is required.';
  }

  if (name.length < 2) {
    return 'Enter your full name.';
  }

  return null;
};

const getEmailError = (email) => {
  if (!email) {
    return 'Email is required.';
  }

  if (!validateEmail(email)) {
    return 'Enter a valid email address.';
  }

  return null;
};

const getPhoneError = (phone) => {
  if (!phone) {
    return 'Phone number is required.';
  }

  if (!validatePhone(phone)) {
    return 'Enter a valid phone number.';
  }

  return null;
};

const getStrongPasswordError = (password) => {
  if (!password) {
    return 'Password is required.';
  }

  if (!validateStrongPassword(password)) {
    return 'Use 8+ chars with upper, lower, number, and symbol.';
  }

  return null;
};

export const getLoginValidationErrors = ({ email, password }) => {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePassword(password);

  const emailError = getEmailError(normalizedEmail);
  if (emailError) {
    errors.email = emailError;
  }

  if (!normalizedPassword) {
    errors.password = 'Password is required.';
  } else if (!validatePassword(normalizedPassword)) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
};

export const getForgotPasswordRequestErrors = ({ email }) => {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);

  const emailError = getEmailError(normalizedEmail);
  if (emailError) {
    errors.email = emailError;
  }

  return errors;
};

export const getForgotPasswordResetErrors = ({ email, otp, password, confirmPassword }) => {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp || '').trim();
  const normalizedPassword = normalizePassword(password);
  const normalizedConfirmPassword = normalizePassword(confirmPassword);

  const emailError = getEmailError(normalizedEmail);
  if (emailError) {
    errors.email = emailError;
  }

  if (!normalizedOtp) {
    errors.otp = 'OTP is required.';
  } else if (!validateOtp(normalizedOtp)) {
    errors.otp = 'Enter the 6-digit OTP.';
  }

  const passwordError = getStrongPasswordError(normalizedPassword);
  if (passwordError) {
    errors.password = normalizedPassword ? passwordError : 'New password is required.';
  }

  if (!normalizedConfirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (normalizedConfirmPassword !== normalizedPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const getRegisterValidationErrors = ({ name, email, phone, address, password, confirmPassword }) => {
  const errors = {};
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const normalizedAddress = normalizeAddress(address);
  const normalizedPassword = normalizePassword(password);
  const normalizedConfirmPassword = normalizePassword(confirmPassword);

  const nameError = getNameError(normalizedName);
  if (nameError) {
    errors.name = nameError;
  }

  const emailError = getEmailError(normalizedEmail);
  if (emailError) {
    errors.email = emailError;
  }

  const phoneError = getPhoneError(normalizedPhone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  if (!normalizedAddress) {
    errors.address = 'Address is required.';
  }

  const passwordError = getStrongPasswordError(normalizedPassword);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!normalizedConfirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (normalizedConfirmPassword !== normalizedPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const getProfileValidationErrors = ({ name, email, phone }) => {
  const errors = {};
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const nameError = getNameError(normalizedName);
  if (nameError) {
    errors.name = nameError;
  }

  const emailError = getEmailError(normalizedEmail);
  if (emailError) {
    errors.email = emailError;
  }

  const phoneError = getPhoneError(normalizedPhone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  return errors;
};
