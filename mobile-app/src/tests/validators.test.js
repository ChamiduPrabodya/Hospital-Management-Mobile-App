import {
  getForgotPasswordRequestErrors,
  getForgotPasswordResetErrors,
  getLoginValidationErrors,
  getProfileValidationErrors,
  getRegisterValidationErrors,
  normalizeAddress,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizePassword,
  validateEmail,
  validateOtp,
  validatePassword,
  validatePhone,
} from '../utils/validators';

describe('mobile-app utils/validators', () => {
  it('validateEmail returns true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('validateEmail returns false for invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('validatePassword requires at least 6 characters', () => {
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('123456')).toBe(true);
  });

  it('validateOtp requires exactly 6 digits', () => {
    expect(validateOtp('12345')).toBe(false);
    expect(validateOtp('123456')).toBe(true);
    expect(validateOtp('12a456')).toBe(false);
  });

  it('validatePhone accepts 10-15 digit phone numbers', () => {
    expect(validatePhone('0771234567')).toBe(true);
    expect(validatePhone('+94771234567')).toBe(true);
    expect(validatePhone('12345')).toBe(false);
  });

  it('normalizes login fields before validation', () => {
    expect(normalizeEmail('  TEST@Example.com ')).toBe('test@example.com');
    expect(normalizeName('  Jane Doe  ')).toBe('Jane Doe');
    expect(normalizePhone('  +94 77 123 4567 ')).toBe('+94771234567');
    expect(normalizeAddress('  12 Main Street  ')).toBe('12 Main Street');
    expect(normalizePassword('  secret123  ')).toBe('secret123');
  });

  it('returns field errors for invalid login input', () => {
    expect(getLoginValidationErrors({ email: '', password: '' })).toEqual({
      email: 'Email is required.',
      password: 'Password is required.',
    });

    expect(getLoginValidationErrors({ email: 'wrong', password: '123' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password must be at least 6 characters.',
    });
  });

  it('returns no errors for valid login input', () => {
    expect(getLoginValidationErrors({
      email: 'patient@example.com',
      password: 'secret123',
    })).toEqual({});
  });

  it('returns field errors for forgot password OTP request input', () => {
    expect(getForgotPasswordRequestErrors({
      email: 'bad-email',
    })).toEqual({
      email: 'Enter a valid email address.',
    });
  });

  it('returns field errors for forgot password reset input', () => {
    expect(getForgotPasswordResetErrors({
      email: 'bad-email',
      otp: '123',
      password: '123',
      confirmPassword: '456',
    })).toEqual({
      email: 'Enter a valid email address.',
      otp: 'Enter the 6-digit OTP.',
      password: 'Password must be at least 6 characters.',
      confirmPassword: 'Passwords do not match.',
    });
  });

  it('accepts valid forgot password reset input', () => {
    expect(getForgotPasswordResetErrors({
      email: 'patient@example.com',
      otp: '123456',
      password: 'secret123',
      confirmPassword: 'secret123',
    })).toEqual({});
  });

  it('returns field errors for invalid register input', () => {
    expect(getRegisterValidationErrors({
      name: ' ',
      email: 'bad-email',
      phone: '123',
      address: ' ',
      password: '123',
      confirmPassword: '456',
    })).toEqual({
      name: 'Full name is required.',
      email: 'Enter a valid email address.',
      phone: 'Enter a valid phone number.',
      address: 'Address is required.',
      password: 'Password must be at least 6 characters.',
      confirmPassword: 'Passwords do not match.',
    });
  });

  it('accepts valid register input', () => {
    expect(getRegisterValidationErrors({
      name: 'Jane Doe',
      email: 'patient@example.com',
      phone: '0771234567',
      address: 'Colombo',
      password: 'secret123',
      confirmPassword: 'secret123',
    })).toEqual({});
  });

  it('returns field errors for invalid profile input', () => {
    expect(getProfileValidationErrors({
      name: 'A',
      email: 'bad-email',
      phone: '123',
    })).toEqual({
      name: 'Enter your full name.',
      email: 'Enter a valid email address.',
      phone: 'Enter a valid phone number.',
    });
  });

  it('accepts valid profile input', () => {
    expect(getProfileValidationErrors({
      name: 'Jane Doe',
      email: 'patient@example.com',
      phone: '+94771234567',
    })).toEqual({});
  });
});
