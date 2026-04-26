jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('../models/user.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  exists: jest.fn(),
}));

jest.mock('../utils/generateToken', () => jest.fn(() => 'token'));

const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { forgotPassword } = require('../controllers/auth.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth.controller forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires email and new password', async () => {
    const req = { body: { email: '', password: '' } };
    const res = createRes();
    const next = jest.fn();

    await forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email and new password are required',
    });
  });

  it('rejects invalid email format', async () => {
    const req = { body: { email: 'bad-email', password: 'secret123' } };
    const res = createRes();
    const next = jest.fn();

    await forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email must be valid',
    });
  });

  it('rejects short passwords', async () => {
    const req = { body: { email: 'patient@example.com', password: '123' } };
    const res = createRes();
    const next = jest.fn();

    await forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password must be at least 6 characters',
    });
  });

  it('returns 404 when the account is not found', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'patient@example.com', password: 'secret123' } };
    const res = createRes();
    const next = jest.fn();

    await forgotPassword(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'patient@example.com',
      isActive: { $ne: false },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No active account found for this email',
    });
  });

  it('updates the password for a matching active account', async () => {
    const user = {
      password: 'old-password',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(user);
    const req = { body: { email: ' Patient@Example.com ', password: 'secret123' } };
    const res = createRes();
    const next = jest.fn();

    await forgotPassword(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'patient@example.com',
      isActive: { $ne: false },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(user.password).toBe('hashed-password');
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password reset successful. You can now sign in.',
    });
  });
});
