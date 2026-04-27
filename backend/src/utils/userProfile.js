const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeName = (name = '') => String(name).trim();
const normalizePhone = (phone = '') => {
  const rawPhone = String(phone).trim();
  const digits = rawPhone.replace(/\D/g, '');
  return rawPhone.startsWith('+') ? `+${digits}` : digits;
};
const normalizeText = (value = '') => String(value).trim();

const EMAIL_MAX_LENGTH = 254;
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;

const isValidEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
};
const isValidPhone = (phone) => {
  const normalizedPhone = normalizePhone(phone);
  const digitsOnly = normalizedPhone.replace(/^\+/, '');
  return /^\+?\d+$/.test(normalizedPhone)
    && digitsOnly.length >= PHONE_MIN_DIGITS
    && digitsOnly.length <= PHONE_MAX_DIGITS;
};

const normalizeUserProfilePayload = (body = {}) => ({
  name: normalizeName(body.name),
  email: normalizeEmail(body.email),
  phone: normalizePhone(body.phone),
  address: normalizeText(body.address),
  profileImage: normalizeText(body.profileImage),
});

const validateUserProfilePayload = (
  payload,
  { requireName = true, requireEmail = true, requirePhone = true } = {}
) => {
  if (requireName && !payload.name) {
    return 'Name is required';
  }

  if (payload.name && payload.name.length < 2) {
    return 'Name must be at least 2 characters';
  }

  if (requireEmail && !payload.email) {
    return 'Email is required';
  }

  if (payload.email && !isValidEmail(payload.email)) {
    return 'Email must be valid';
  }

  if (requirePhone && !payload.phone) {
    return 'Phone number is required';
  }

  if (payload.phone && !isValidPhone(payload.phone)) {
    return 'Phone number must be valid';
  }

  return null;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  normalizeUserProfilePayload,
  validateUserProfilePayload,
};
