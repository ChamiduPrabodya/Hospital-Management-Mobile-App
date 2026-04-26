export const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

export const normalizePassword = (password = '') => String(password).trim();

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(normalizeEmail(email));
};

export const validatePassword = (password) => {
  return normalizePassword(password).length >= 6;
};

export const getLoginValidationErrors = ({ email, password }) => {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePassword(password);

  if (!normalizedEmail) {
    errors.email = 'Email is required.';
  } else if (!validateEmail(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!normalizedPassword) {
    errors.password = 'Password is required.';
  } else if (!validatePassword(normalizedPassword)) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
};

export const getForgotPasswordValidationErrors = ({ email, password, confirmPassword }) => {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePassword(password);
  const normalizedConfirmPassword = normalizePassword(confirmPassword);

  if (!normalizedEmail) {
    errors.email = 'Email is required.';
  } else if (!validateEmail(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!normalizedPassword) {
    errors.password = 'New password is required.';
  } else if (!validatePassword(normalizedPassword)) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!normalizedConfirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (normalizedConfirmPassword !== normalizedPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};
