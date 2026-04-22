jest.mock('../models/appointment.model', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/doctor.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/service.model', () => ({
  findOne: jest.fn(),
}));

const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Service = require('../models/service.model');

const { createAppointment } = require('../controllers/appointment.controller');

const ids = {
  doctor: '507f1f77bcf86cd799439011',
  service: '507f1f77bcf86cd799439012',
  user: '507f1f77bcf86cd799439013',
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('appointment.controller createAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects booking when doctor is not available', async () => {
    Doctor.findOne.mockResolvedValue({ _id: ids.doctor, availabilityStatus: false });
    Service.findOne.mockResolvedValue({ _id: ids.service, availabilityStatus: true });

    const req = {
      user: { _id: ids.user },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: '2026-04-10',
        appointmentTime: '10:00',
        notes: 'test',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Selected doctor is not available' });
    expect(Appointment.findOne).not.toHaveBeenCalled();
  });

  it('prevents double booking (409 when slot already booked)', async () => {
    Doctor.findOne.mockResolvedValue({ _id: ids.doctor, availabilityStatus: true });
    Service.findOne.mockResolvedValue({ _id: ids.service, availabilityStatus: true });
    Appointment.findOne.mockResolvedValue({ _id: 'existing' });

    const req = {
      user: { _id: ids.user },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: '2026-04-10',
        appointmentTime: '10:00',
        notes: 'test',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Selected slot is already booked for this doctor' });
    expect(Appointment.create).not.toHaveBeenCalled();
  });

  it('creates appointment when slot is free', async () => {
    Doctor.findOne.mockResolvedValue({ _id: ids.doctor, availabilityStatus: true });
    Service.findOne.mockResolvedValue({ _id: ids.service, availabilityStatus: true });
    Appointment.findOne.mockResolvedValue(null);
    Appointment.create.mockResolvedValue({ _id: 'app1', userId: ids.user });

    const req = {
      user: { _id: ids.user },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: '2026-04-10',
        appointmentTime: '10:00',
        notes: 'test',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: 'app1', userId: ids.user });
    expect(Appointment.create).toHaveBeenCalled();
  });
});
