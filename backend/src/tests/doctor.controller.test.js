jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('../models/doctor.model', () => ({
  create: jest.fn(),
}));

jest.mock('../models/department.model', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/service.model', () => ({
  find: jest.fn(),
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
const Department = require('../models/department.model');
const Service = require('../models/service.model');
const User = require('../models/user.model');
const { createDoctor } = require('../controllers/doctor.controller');

const ids = {
  department: '507f1f77bcf86cd799439010',
  service: '507f1f77bcf86cd799439012',
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('doctor.controller createDoctor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Department.findById.mockResolvedValue({ _id: ids.department, name: 'Cardiology' });
    Service.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: ids.service, departmentId: ids.department }]),
    });
  });

  it('requires login email and password when creating a doctor', async () => {
    const req = {
      body: {
        name: 'Dr Test',
        specialization: 'Cardiology',
        experience: 5,
        departmentId: ids.department,
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name, specialization, department, experience, email, and password are required',
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
        departmentId: ids.department,
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
        departmentId: ids.department,
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
        departmentId: ids.department,
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
        departmentId: ids.department,
        email: 'Doctor@Example.com ',
        password: 'Doctor123!',
        services: [{ serviceId: ids.service, price: 2500, duration: 30 }],
        availabilityMode: 'daily',
        dailyTimeSlots: ['09:00'],
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

  it('capitalizes the first letter of a manually entered specialization', async () => {
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
        specialization: 'neurology',
        experience: 5,
        departmentId: ids.department,
        email: 'doctor@example.com',
        password: 'Doctor123!',
        services: [{ serviceId: ids.service, price: 2500, duration: 30 }],
        availabilityMode: 'daily',
        dailyTimeSlots: ['09:00'],
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(Doctor.create).toHaveBeenCalledWith(expect.objectContaining({
      specialization: 'Neurology',
    }));
  });

  it('creates doctor profile with selected services and doctor prices', async () => {
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
        departmentId: ids.department,
        email: 'doctor@example.com',
        password: 'Doctor123!',
        services: [{ serviceId: ids.service, price: '3500', duration: '45' }],
        availabilityMode: 'custom',
        availabilitySchedule: [{ date: '2099-04-10', timeSlots: ['09:00', '10:00'] }],
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createDoctor(req, res, next);

    expect(Doctor.create).toHaveBeenCalledWith(expect.objectContaining({
      services: [{
        serviceId: ids.service,
        price: 3500,
        duration: 45,
        availabilityStatus: true,
      }],
    }));
  });
});
