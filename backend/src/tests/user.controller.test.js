jest.mock('../models/user.model', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../models/appointment.model', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../models/payment.model', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../models/complaint.model', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../models/medicalDocument.model', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../utils/apiResponse', () => ({
  sendSuccess: jest.fn(),
}));

jest.mock('../utils/fileAsset', () => ({
  deleteFileAsset: jest.fn(),
}));

const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Payment = require('../models/payment.model');
const Complaint = require('../models/complaint.model');
const MedicalDocument = require('../models/medicalDocument.model');
const { sendSuccess } = require('../utils/apiResponse');
const { deleteFileAsset } = require('../utils/fileAsset');
const {
  getUserById,
  updateUser,
  deleteUser,
  permanentlyDeleteUser,
  reactivateUser,
} = require('../controllers/user.controller');

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

describe('user.controller getUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows admins to load inactive users', async () => {
    const select = jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'patient@example.com',
      isActive: false,
    });
    User.findOne.mockReturnValue({ select });
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
    };
    const res = createRes();

    await getUserById(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439011',
      email: 'patient@example.com',
      isActive: false,
    });
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
    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      200,
      'User deactivated successfully',
      {
        _id: '507f1f77bcf86cd799439011',
        isActive: false,
        deletedAt: user.deletedAt,
        deactivationReason: 'Requested account closure',
      }
    );
  });
});

describe('user.controller permanentlyDeleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Appointment.countDocuments.mockResolvedValue(0);
    Payment.countDocuments.mockResolvedValue(0);
    Complaint.countDocuments.mockResolvedValue(0);
    MedicalDocument.countDocuments.mockResolvedValue(0);
  });

  it('blocks permanent delete for non-patient accounts', async () => {
    User.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      role: 'doctor',
    });
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
    };
    const res = createRes();

    await permanentlyDeleteUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Permanent delete is only available for patient accounts',
    });
  });

  it('blocks permanent delete when linked records exist', async () => {
    User.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      role: 'patient',
    });
    Appointment.countDocuments.mockResolvedValue(2);
    Complaint.countDocuments.mockResolvedValue(1);

    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
    };
    const res = createRes();

    await permanentlyDeleteUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot permanently delete this patient because linked records still exist',
      data: {
        appointmentCount: 2,
        paymentCount: 0,
        complaintCount: 1,
        medicalDocumentCount: 0,
      },
    });
  });

  it('permanently deletes a patient with no linked records', async () => {
    const deleteOne = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      role: 'patient',
      profileImageAssetId: 'asset-id',
      deleteOne,
    });

    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
    };
    const res = createRes();

    await permanentlyDeleteUser(req, res, jest.fn());

    expect(deleteFileAsset).toHaveBeenCalledWith('asset-id');
    expect(deleteOne).toHaveBeenCalled();
    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      200,
      'Patient permanently deleted successfully',
      {
        _id: '507f1f77bcf86cd799439011',
        permanentlyDeleted: true,
      }
    );
  });
});

describe('user.controller reactivateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 409 when the account is already active', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        isActive: true,
      }),
    });
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
    };
    const res = createRes();

    await reactivateUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User account is already active',
    });
  });

  it('reactivates an inactive user', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const user = {
      _id: '507f1f77bcf86cd799439011',
      isActive: false,
      deletedAt: new Date(),
      deactivationReason: 'Requested account closure',
      save,
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439099', role: 'admin' },
    };
    const res = createRes();

    await reactivateUser(req, res, jest.fn());

    expect(user.isActive).toBe(true);
    expect(user.deletedAt).toBe(null);
    expect(user.deactivationReason).toBe(null);
    expect(save).toHaveBeenCalled();
    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      200,
      'User reactivated successfully',
      user
    );
  });
});
