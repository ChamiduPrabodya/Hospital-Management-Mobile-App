jest.mock('../models/appointment.model', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
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

const {
  createAppointment,
  getDoctorBookedSlots,
  updateMedicalNote,
} = require('../controllers/appointment.controller');

const ids = {
  doctor: '507f1f77bcf86cd799439011',
  service: '507f1f77bcf86cd799439012',
  user: '507f1f77bcf86cd799439013',
};
const futureDate = '2099-04-10';

const doctorAvailableForService = {
  _id: ids.doctor,
  availabilityStatus: true,
  availabilityMode: 'daily',
  dailyTimeSlots: ['10:00'],
  availabilitySchedule: [],
  services: [{ serviceId: ids.service, price: 2000, duration: 30, availabilityStatus: true }],
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
      user: { _id: ids.user, role: 'patient' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: futureDate,
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
    Doctor.findOne.mockResolvedValue(doctorAvailableForService);
    Service.findOne.mockResolvedValue({ _id: ids.service, availabilityStatus: true });
    Appointment.findOne.mockResolvedValue({ _id: 'existing' });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: futureDate,
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
    Doctor.findOne.mockResolvedValue(doctorAvailableForService);
    Service.findOne.mockResolvedValue({ _id: ids.service, availabilityStatus: true });
    Appointment.findOne.mockResolvedValue(null);
    Appointment.create.mockResolvedValue({ _id: 'app1', userId: ids.user });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: futureDate,
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

  it('uses doctor-specific service price and duration when creating an appointment', async () => {
    Doctor.findOne.mockResolvedValue({
      _id: ids.doctor,
      availabilityStatus: true,
      availabilityMode: 'daily',
      dailyTimeSlots: ['10:00'],
      availabilitySchedule: [],
      services: [{ serviceId: ids.service, price: 3500, duration: 45, availabilityStatus: true }],
    });
    Service.findOne.mockResolvedValue({
      _id: ids.service,
      serviceName: 'Consultation',
      price: 2000,
      duration: 30,
      availabilityStatus: true,
    });
    Appointment.findOne.mockResolvedValue(null);
    Appointment.create.mockResolvedValue({ _id: 'app1', userId: ids.user });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: futureDate,
        appointmentTime: '10:00',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(Appointment.create).toHaveBeenCalledWith(expect.objectContaining({
      serviceSnapshot: {
        serviceName: 'Consultation',
        price: 3500,
        duration: 45,
      },
    }));
  });

  it('rejects booking a service the selected doctor does not provide', async () => {
    Doctor.findOne.mockResolvedValue({
      _id: ids.doctor,
      availabilityStatus: true,
      availabilityMode: 'daily',
      dailyTimeSlots: ['10:00'],
      availabilitySchedule: [],
      services: [{ serviceId: '507f1f77bcf86cd799439099', price: 2000, duration: 30, availabilityStatus: true }],
    });
    Service.findOne.mockResolvedValue({
      _id: ids.service,
      serviceName: 'Consultation',
      price: 2000,
      duration: 30,
      availabilityStatus: true,
    });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: futureDate,
        appointmentTime: '10:00',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Selected doctor does not provide this service' });
    expect(Appointment.create).not.toHaveBeenCalled();
  });

  it('rejects appointment creation for non-patient users', async () => {
    const req = {
      user: { _id: ids.user, role: 'admin' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: futureDate,
        appointmentTime: '10:00',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Only patients can create appointments' });
    expect(Doctor.findOne).not.toHaveBeenCalled();
    expect(Appointment.create).not.toHaveBeenCalled();
  });

  it('rejects appointment creation for past date and time', async () => {
    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        doctorId: ids.doctor,
        serviceId: ids.service,
        appointmentDate: '2000-01-01',
        appointmentTime: '10:00',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await createAppointment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Appointment date and time must be current or upcoming' });
    expect(Doctor.findOne).not.toHaveBeenCalled();
    expect(Appointment.create).not.toHaveBeenCalled();
  });
});

describe('appointment.controller updateMedicalNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets the assigned doctor save a medical note', async () => {
    const appointment = {
      _id: 'app1',
      doctorId: ids.doctor,
      save: jest.fn().mockResolvedValue(),
    };
    const populatedAppointment = {
      _id: 'app1',
      doctorId: ids.doctor,
      medicalNote: { text: 'Patient needs follow-up', addedBy: ids.user },
    };
    const query = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(populatedAppointment)),
    };
    Appointment.findById
      .mockResolvedValueOnce(appointment)
      .mockReturnValueOnce(query);

    const req = {
      user: { _id: ids.user, role: 'doctor', doctorProfileId: ids.doctor },
      params: { id: ids.service },
      body: { text: 'Patient needs follow-up' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateMedicalNote(req, res, next);

    expect(appointment.medicalNote.text).toBe('Patient needs follow-up');
    expect(appointment.medicalNote.addedBy).toBe(ids.user);
    expect(appointment.save).toHaveBeenCalled();
    expect(query.populate).toHaveBeenCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(populatedAppointment);
  });

  it('blocks doctors who are not assigned to the appointment', async () => {
    Appointment.findById.mockResolvedValue({
      _id: 'app1',
      doctorId: ids.doctor,
      save: jest.fn(),
    });

    const req = {
      user: { _id: ids.user, role: 'doctor', doctorProfileId: '507f1f77bcf86cd799439099' },
      params: { id: ids.service },
      body: { text: 'Patient needs follow-up' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateMedicalNote(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Only the assigned doctor can update medical notes' });
  });
});

describe('appointment.controller getDoctorBookedSlots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns booked slot times for the selected doctor and date', async () => {
    Doctor.findOne.mockResolvedValue({ _id: ids.doctor, availabilityStatus: true });
    Appointment.find.mockResolvedValue([
      { appointmentTime: '09:00' },
      { appointmentTime: '10:30' },
    ]);

    const req = {
      params: { doctorId: ids.doctor },
      query: { date: futureDate },
    };
    const res = createRes();
    const next = jest.fn();

    await getDoctorBookedSlots(req, res, next);

    expect(Appointment.find).toHaveBeenCalledWith(expect.objectContaining({
      doctorId: ids.doctor,
      status: { $nin: ['cancelled', 'rejected'] },
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      doctorId: ids.doctor,
      date: futureDate,
      bookedSlots: ['09:00', '10:30'],
    });
  });
});
