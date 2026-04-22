jest.mock('../models/complaint.model', () => ({
  findById: jest.fn(),
}));

const Complaint = require('../models/complaint.model');
const { updateComplaintStatus } = require('../controllers/complaint.controller');

const ids = {
  complaint: '507f1f77bcf86cd799439031',
  user: '507f1f77bcf86cd799439032',
  admin: '507f1f77bcf86cd799439033',
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('complaint.controller updateComplaintStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non-admin (403)', async () => {
    Complaint.findById.mockResolvedValue({
      _id: ids.complaint,
      userId: ids.user,
      status: 'open',
      save: jest.fn(),
    });

    const req = {
      user: { _id: ids.user, role: 'patient' },
      params: { id: ids.complaint },
      body: { status: 'resolved', adminReply: 'ok' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateComplaintStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('rejects invalid status (400)', async () => {
    Complaint.findById.mockResolvedValue({
      _id: ids.complaint,
      userId: ids.user,
      status: 'open',
      save: jest.fn(),
    });

    const req = {
      user: { _id: ids.admin, role: 'admin' },
      params: { id: ids.complaint },
      body: { status: 'bad' },
    };
    const res = createRes();
    const next = jest.fn();

    await updateComplaintStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status' });
  });
});
