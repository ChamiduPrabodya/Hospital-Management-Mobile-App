const roleMiddleware = require('../middleware/role.middleware');

describe('role.middleware', () => {
  it('returns 401 when req.user is missing', () => {
    const mw = roleMiddleware('admin');
    const req = { user: null };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized access', data: null });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user role not allowed', () => {
    const mw = roleMiddleware('admin');
    const req = { user: { role: 'patient' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden: insufficient permissions', data: null });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user role is allowed', () => {
    const mw = roleMiddleware('admin');
    const req = { user: { role: 'admin' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
