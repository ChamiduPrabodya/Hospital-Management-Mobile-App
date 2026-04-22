import { validateEmail, validatePassword } from '../utils/validators';

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
});

