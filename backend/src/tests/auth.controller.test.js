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
const generateToken = require('../utils/generateToken');
const { forgotPassword, registerUser } = require('../controllers/auth.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth.controller registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.genSalt.mockResolvedValue('salt');
    User.exists.mockResolvedValue(true);
  });

  it('requires name, email, and password', async () => {
    const req = { body: { name: '', email: '', password: '' } };
    const res = createRes();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name, email, and password are required',
    });
  });

  it('rejects names shorter than 2 characters', async () => {
    const req = { body: { name: 'A', email: 'patient@example.com', password: 'secret123' } };
    const res = createRes();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name must be at least 2 characters',
    });
  });

  it('rejects invalid email addresses', async () => {
    const req = { body: { name: 'Jane Doe', email: 'bad-email', password: 'secret123' } };
    const res = createRes();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email must be valid',
    });
  });

  it('rejects short passwords', async () => {
    const req = { body: { name: 'Jane Doe', email: 'patient@example.com', password: '123' } };
    const res = createRes();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password must be at least 6 characters',
    });
  });

  it('returns 409 for duplicate email addresses', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-user' });
    const req = { body: { name: 'Jane Doe', email: 'patient@example.com', password: 'secret123' } };
    const res = createRes();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email is already registered',
    });
  });

  it('trims and normalizes fields before creating the user', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'user-id',
      name: 'Jane Doe',
      email: 'patient@example.com',
      role: 'patient',
      doctorProfileId: null,
      phone: null,
      address: null,
      profileImage: null,
    });

    const req = {
      body: {
        name: '  Jane Doe  ',
        email: '  Patient@Example.com ',
        password: ' secret123 ',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await registerUser(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'patient@example.com' });
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 'salt');
    expect(User.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'patient@example.com',
      password: 'hashed-password',
      role: 'patient',
    });
    expect(generateToken).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      token: 'token',
      _id: 'user-id',
      name: 'Jane Doe',
      email: 'patient@example.com',
      role: 'patient',
      doctorProfileId: null,
      phone: null,
      address: null,
      profileImage: null,
    });
  });
});

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
