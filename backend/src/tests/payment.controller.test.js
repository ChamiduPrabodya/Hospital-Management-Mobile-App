jest.mock('../models/payment.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../models/appointment.model', () => ({
  findById: jest.fn(),
}));

const Payment = require('../models/payment.model');
const Appointment = require('../models/appointment.model');

const { createPayment } = require('../controllers/payment.controller');

const ids = {
  appointment: '507f1f77bcf86cd799439021',
  user: '507f1f77bcf86cd799439022',
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('payment.controller createPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects payment when appointment is not approved', async () => {
    Appointment.findById.mockResolvedValue({
      _id: ids.appointment,
      status: 'pending',
      userId: ids.user,
    });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        appointmentId: ids.appointment,
        amount: 500,
        paymentMethod: 'card',
      },
    };

    const res = createRes();
    const next = jest.fn();
    await createPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Payment can be made only for approved appointments' });
    expect(Payment.create).not.toHaveBeenCalled();
  });

  it('prevents multiple payments for same appointment (409)', async () => {
    Appointment.findById.mockResolvedValue({
      _id: ids.appointment,
      status: 'approved',
      userId: ids.user,
      save: jest.fn(),
    });

    Payment.findOne.mockResolvedValue({
      _id: 'p1',
      appointmentId: ids.appointment,
      status: 'completed',
    });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        appointmentId: ids.appointment,
        amount: 500,
        paymentMethod: 'card',
      },
    };

    const res = createRes();
    const next = jest.fn();
    await createPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Payment already exists for this appointment' });
    expect(Payment.create).not.toHaveBeenCalled();
  });

  it('creates payment for approved appointment and marks paymentStatus paid', async () => {
    const appointment = {
      _id: ids.appointment,
      status: 'approved',
      userId: ids.user,
      save: jest.fn().mockResolvedValue(true),
    };
    Appointment.findById.mockResolvedValue(appointment);
    Payment.findOne.mockResolvedValue(null);
    Payment.create.mockResolvedValue({ _id: 'p1', appointmentId: ids.appointment, status: 'completed', amount: 500 });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      body: {
        appointmentId: ids.appointment,
        amount: 500,
        paymentMethod: 'card',
        status: 'completed',
      },
    };

    const res = createRes();
    const next = jest.fn();
    await createPayment(req, res, next);

    expect(Payment.create).toHaveBeenCalled();
    expect(appointment.save).toHaveBeenCalled();
    expect(appointment.paymentStatus).toBe('paid');
    expect(appointment.paidAt).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: 'p1', appointmentId: ids.appointment, status: 'completed', amount: 500 });
  });
});
