jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('../models/doctor.model', () => ({
  create: jest.fn(),
}));

jest.mock('../models/user.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/appointment.model', () => ({
  countDocuments: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const { createDoctor } = require('../controllers/doctor.controller');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('doctor.controller createDoctor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires login email and password when creating a doctor', async () => {
    const req = {
      body: {
        name: 'Dr Test',
        specialization: 'Cardiology',
        experience: 5,
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name, specialization, experience, email, and password are required',
    });
    expect(Doctor.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate doctor login email', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-user' });

    const req = {
      body: {
        name: 'Dr Test',
        specialization: 'Cardiology',
        experience: 5,
        email: 'doctor@example.com',
        password: 'Doctor123!',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Doctor email is already used by another account',
    });
    expect(Doctor.create).not.toHaveBeenCalled();
  });

  it('rejects invalid doctor login email', async () => {
    const req = {
      body: {
        name: 'Dr Test',
        specialization: 'Cardiology',
        experience: 5,
        email: 'not-an-email',
        password: 'doctor123',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Doctor email must be valid',
    });
    expect(Doctor.create).not.toHaveBeenCalled();
  });

  it('rejects weak doctor passwords', async () => {
    const req = {
      body: {
        name: 'Dr Test',
        specialization: 'Cardiology',
        experience: 5,
        email: 'doctor@example.com',
        password: 'doctor123',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Doctor password must use 8+ characters with uppercase, lowercase, number, and symbol',
    });
    expect(Doctor.create).not.toHaveBeenCalled();
  });

  it('creates doctor profile and linked doctor user', async () => {
    User.findOne.mockResolvedValue(null);
    const doctor = {
      _id: 'doctor-id',
      save: jest.fn().mockResolvedValue(true),
    };
    Doctor.create.mockResolvedValue(doctor);
    User.create.mockResolvedValue({ _id: 'user-id' });

    const req = {
      body: {
        name: 'Dr Test',
        specialization: 'Cardiology',
        experience: 5,
        email: 'Doctor@Example.com ',
        password: 'Doctor123!',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(bcrypt.hash).toHaveBeenCalledWith('Doctor123!', 10);
    expect(Doctor.create).toHaveBeenCalled();
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'doctor@example.com',
      role: 'doctor',
      doctorProfileId: 'doctor-id',
    }));
    expect(doctor.userId).toBe('user-id');
    expect(doctor.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(doctor);
  });
});
