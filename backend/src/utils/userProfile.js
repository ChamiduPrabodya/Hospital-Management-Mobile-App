const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeName = (name = '') => String(name).trim();
const normalizePhone = (phone = '') => String(phone).replace(/[^\d+]/g, '').trim();
const normalizeText = (value = '') => String(value).trim();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
const isValidPhone = (phone) => /^\+?\d{10,15}$/.test(normalizePhone(phone));

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
