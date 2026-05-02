jest.mock('../models/user.model', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../utils/apiResponse', () => ({
  sendSuccess: jest.fn(),
}));

const User = require('../models/user.model');
const { sendSuccess } = require('../utils/apiResponse');
const { updateUser, deleteUser } = require('../controllers/user.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('user.controller updateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks non-admin users from updating another account', async () => {
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439012', role: 'patient' },
      body: {},
    };
    const res = createRes();

    await updateUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('rejects duplicate email updates', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-user' });
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '0771234567',
        address: 'Colombo',
      },
    };
    const res = createRes();

    await updateUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email is already registered',
    });
  });

  it('normalizes and updates the user profile', async () => {
    User.findOne.mockResolvedValue(null);
    const updatedUser = {
      _id: '507f1f77bcf86cd799439011',
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
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439011', role: 'patient' },
      body: {
        name: '  Jane Doe  ',
        email: ' Jane@Example.com ',
        phone: ' +94 77 123 4567 ',
        address: ' Colombo ',
        profileImage: ' ',
      },
    };
    const res = createRes();

    await updateUser(req, res, jest.fn());

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', isActive: { $ne: false } },
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

describe('user.controller deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a deactivation reason', async () => {
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
      body: { reason: ' ' },
    };
    const res = createRes();

    await deleteUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'A deactivation reason is required' });
  });

  it('stores the deactivation reason and soft-deletes the user', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      isActive: true,
      deletedAt: null,
      deactivationReason: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(user);
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
      body: { reason: 'Requested account closure' },
    };
    const res = createRes();

    await deleteUser(req, res, jest.fn());

    expect(user.isActive).toBe(false);
    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(user.deactivationReason).toBe('Requested account closure');
    expect(user.save).toHaveBeenCalled();
    expect(sendSuccess).toHaveBeenCalledWith(res, 200, 'User deactivated successfully');
  });
});
