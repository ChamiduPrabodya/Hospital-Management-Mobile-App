import {
  getLoginValidationErrors,
  normalizeEmail,
  normalizePassword,
  validateEmail,
  validatePassword,
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

  it('normalizes login fields before validation', () => {
    expect(normalizeEmail('  TEST@Example.com ')).toBe('test@example.com');
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
});
