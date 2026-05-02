jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('crypto', () => ({
  randomInt: jest.fn(() => 123456),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed-otp'),
  })),
}));

jest.mock('../models/user.model', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
  exists: jest.fn(),
}));

jest.mock('../utils/generateToken', () => jest.fn(() => 'token'));
jest.mock('../bootstrap/ensureDemoAuthData', () => jest.fn().mockResolvedValue(undefined));

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const ensureDemoAuthData = require('../bootstrap/ensureDemoAuthData');
const {
  registerUser,
  loginUser,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  updateMe,
} = require('../controllers/auth.controller');

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

  it('requires name, email, phone, address, and password', async () => {
    const req = { body: { name: '', email: '', phone: '', address: '', password: '' } };
    const res = createRes();

    await registerUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name, email, phone, address, and password are required',
    });
  });

  it('rejects names shorter than 2 characters', async () => {
    const req = { body: { name: 'A', email: 'patient@example.com', phone: '0771234567', address: 'Colombo', password: 'secret123' } };
    const res = createRes();

    await registerUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name must be at least 2 characters',
    });
  });

  it('rejects invalid email addresses', async () => {
    const req = { body: { name: 'Jane Doe', email: 'bad-email', phone: '0771234567', address: 'Colombo', password: 'secret123' } };
    const res = createRes();

    await registerUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email must be valid',
    });
  });

  it('rejects invalid phone numbers', async () => {
    const req = { body: { name: 'Jane Doe', email: 'patient@example.com', phone: '123', address: 'Colombo', password: 'secret123' } };
    const res = createRes();

    await registerUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Phone number must be valid',
    });
  });

  it('rejects weak passwords during registration', async () => {
    const req = { body: { name: 'Jane Doe', email: 'patient@example.com', phone: '0771234567', address: 'Colombo', password: 'secret123' } };
    const res = createRes();

    await registerUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password must use 8+ characters with uppercase, lowercase, number, and symbol',
    });
  });

  it('returns 409 for duplicate email addresses', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-user' });
    const req = { body: { name: 'Jane Doe', email: 'patient@example.com', phone: '0771234567', address: 'Colombo', password: 'Secret123!' } };
    const res = createRes();

    await registerUser(req, res, jest.fn());

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
      phone: '+94771234567',
      address: 'Colombo',
      profileImage: null,
    });

    const req = {
      body: {
        name: '  Jane Doe  ',
        email: '  Patient@Example.com ',
        phone: ' +94 77 123 4567 ',
        address: ' Colombo ',
        password: ' Secret123! ',
      },
    };
    const res = createRes();

    await registerUser(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({ email: 'patient@example.com' });
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('Secret123!', 'salt');
    expect(User.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'patient@example.com',
      phone: '+94771234567',
      address: 'Colombo',
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
      phone: '+94771234567',
      address: 'Colombo',
      profileImage: null,
    });
  });
});

describe('auth.controller loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.DOCTOR_EMAIL = 'doctor@example.com';
  });

  it('requires email and password', async () => {
    const req = { body: { email: '', password: '' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email and password are required',
    });
  });

  it('rejects invalid email addresses', async () => {
    const req = { body: { email: 'bad-email', password: 'secret123' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email must be valid',
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects short passwords', async () => {
    const req = { body: { email: 'patient@example.com', password: '123' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password must be at least 6 characters',
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects inactive or missing users', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'patient@example.com', password: 'secret123' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(ensureDemoAuthData).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalledWith({
      email: 'patient@example.com',
      isActive: { $ne: false },
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid credentials',
    });
  });

  it('rejects wrong passwords', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user-id',
      password: 'hashed-password',
    });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 'patient@example.com', password: 'secret123' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(bcrypt.compare).toHaveBeenCalledWith('secret123', 'hashed-password');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid credentials',
    });
  });

  it('does not try to bootstrap demo data for unknown emails', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'someone@example.org', password: 'secret123' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(ensureDemoAuthData).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid credentials',
    });
  });

  it('repairs a demo user when the stored password is stale', async () => {
    User.findOne
      .mockResolvedValueOnce({
        _id: 'user-id',
        password: 'old-hash',
      })
      .mockResolvedValueOnce({
        _id: 'user-id',
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'new-hash',
        role: 'admin',
        doctorProfileId: null,
        phone: '0771234567',
        address: 'Colombo',
        profileImage: null,
      });
    bcrypt.compare
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const req = { body: { email: 'admin@example.com', password: 'admin123' } };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(ensureDemoAuthData).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenNthCalledWith(1, 'admin123', 'old-hash');
    expect(bcrypt.compare).toHaveBeenNthCalledWith(2, 'admin123', 'new-hash');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('logs in with trimmed and normalized credentials', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user-id',
      name: 'Jane Doe',
      email: 'patient@example.com',
      password: 'hashed-password',
      role: 'patient',
      doctorProfileId: null,
      phone: null,
      address: null,
      profileImage: null,
    });
    bcrypt.compare.mockResolvedValue(true);
    const req = {
      body: {
        email: ' Patient@Example.com ',
        password: ' secret123 ',
      },
    };
    const res = createRes();

    await loginUser(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'patient@example.com',
      isActive: { $ne: false },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('secret123', 'hashed-password');
    expect(generateToken).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(200);
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

describe('auth.controller requestPasswordResetOtp', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('requires email', async () => {
    const req = { body: { email: '' } };
    const res = createRes();

    await requestPasswordResetOtp(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email is required',
    });
  });

  it('rejects invalid email format', async () => {
    const req = { body: { email: 'bad-email' } };
    const res = createRes();

    await requestPasswordResetOtp(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email must be valid',
    });
  });

  it('returns 404 when the account is not found', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'patient@example.com' } };
    const res = createRes();

    await requestPasswordResetOtp(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'patient@example.com',
      isActive: { $ne: false },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No active account found for this email',
    });
  });

  it('stores a hashed OTP and returns the OTP in non-production', async () => {
    const user = {
      save: jest.fn().mockResolvedValue(true),
      resetPasswordOtpHash: null,
      resetPasswordOtpExpiresAt: null,
    };
    User.findOne.mockResolvedValue(user);
    const req = { body: { email: 'Patient@Example.com ' } };
    const res = createRes();

    await requestPasswordResetOtp(req, res, jest.fn());

    expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
    expect(user.resetPasswordOtpHash).toBe('hashed-otp');
    expect(user.resetPasswordOtpExpiresAt).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'A 6-digit OTP has been generated. It expires in 10 minutes.',
      otp: '123456',
    });
  });
});

describe('auth.controller resetPasswordWithOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires email, OTP, and new password', async () => {
    const req = { body: { email: '', otp: '', password: '' } };
    const res = createRes();

    await resetPasswordWithOtp(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email, OTP, and new password are required',
    });
  });

  it('rejects invalid OTP format', async () => {
    const req = { body: { email: 'patient@example.com', otp: '12', password: 'Secret123!' } };
    const res = createRes();

    await resetPasswordWithOtp(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP must be a 6-digit code',
    });
  });

  it('returns 404 when the account is not found', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'patient@example.com', otp: '123456', password: 'Secret123!' } };
    const res = createRes();

    await resetPasswordWithOtp(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'patient@example.com',
      isActive: { $ne: false },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No active account found for this email',
    });
  });

  it('rejects weak reset passwords before checking the account', async () => {
    const req = { body: { email: 'patient@example.com', otp: '123456', password: 'secret123' } };
    const res = createRes();

    await resetPasswordWithOtp(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password must use 8+ characters with uppercase, lowercase, number, and symbol',
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects invalid or expired OTP values', async () => {
    User.findOne.mockResolvedValue({
      resetPasswordOtpHash: 'hashed-otp',
      resetPasswordOtpExpiresAt: new Date(Date.now() - 1000),
    });
    const req = { body: { email: 'patient@example.com', otp: '123456', password: 'Secret123!' } };
    const res = createRes();

    await resetPasswordWithOtp(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP is invalid or has expired',
    });
  });

  it('updates the password and clears OTP fields for a valid OTP', async () => {
    const user = {
      password: 'old-password',
      resetPasswordOtpHash: 'hashed-otp',
      resetPasswordOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(user);
    const req = {
      body: {
        email: ' Patient@Example.com ',
        otp: '123456',
        password: ' Secret123! ',
      },
    };
    const res = createRes();

    await resetPasswordWithOtp(req, res, jest.fn());

    expect(bcrypt.hash).toHaveBeenCalledWith('Secret123!', 10);
    expect(user.password).toBe('hashed-password');
    expect(user.resetPasswordOtpHash).toBe(null);
    expect(user.resetPasswordOtpExpiresAt).toBe(null);
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password reset successful. You can now sign in.',
    });
  });
});

describe('auth.controller updateMe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates the profile payload', async () => {
    const req = {
      user: { _id: 'user-id' },
      body: { name: '', email: 'bad-email', phone: '123' },
    };
    const res = createRes();

    await updateMe(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name is required',
    });
  });

  it('returns 409 when another active user already has the email', async () => {
    User.findOne.mockResolvedValue({ _id: 'other-user' });
    const req = {
      user: { _id: 'user-id' },
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '0771234567',
        address: 'Colombo',
      },
    };
    const res = createRes();

    await updateMe(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'jane@example.com',
      _id: { $ne: 'user-id' },
      isActive: { $ne: false },
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email is already registered',
    });
  });

  it('updates and normalizes the current user profile', async () => {
    User.findOne.mockResolvedValue(null);
    const updatedUser = {
      _id: 'user-id',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+94771234567',
      address: 'Colombo',
      profileImage: '',
    };
    User.findOneAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const req = {
      user: { _id: 'user-id' },
      body: {
        name: '  Jane Doe  ',
        email: ' Jane@Example.com ',
        phone: ' +94 77 123 4567 ',
        address: ' Colombo ',
        profileImage: ' ',
      },
    };
    const res = createRes();

    await updateMe(req, res, jest.fn());

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-id', isActive: { $ne: false } },
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+94771234567',
        address: 'Colombo',
        profileImage: '',
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });
});
