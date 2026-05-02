const Department = require('../models/department.model');
const Doctor = require('../models/doctor.model');
const Service = require('../models/service.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam } = require('../utils/validateObjectId');

const normalizeDepartmentPayload = (payload = {}) => ({
  name: String(payload.name || '').trim(),
  description: String(payload.description || '').trim(),
  location: String(payload.location || '').trim(),
  contactNumber: String(payload.contactNumber || '').trim(),
});

exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1, createdAt: -1 });
  res.status(200).json(departments);
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const payload = normalizeDepartmentPayload(req.body);

  if (!payload.name || !payload.description || !payload.location) {
    return res.status(400).json({
      message: 'Department name, description, and location are required',
    });
  }

  const existingDepartment = await Department.findOne({
    name: { $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });

  if (existingDepartment) {
    return res.status(409).json({ message: 'A department with this name already exists' });
  }

  const department = await Department.create(payload);
  res.status(201).json(department);
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'department ID')) return;

  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ message: 'Department not found' });
  }

  const payload = normalizeDepartmentPayload({
    name: req.body.name !== undefined ? req.body.name : department.name,
    description: req.body.description !== undefined ? req.body.description : department.description,
    location: req.body.location !== undefined ? req.body.location : department.location,
    contactNumber: req.body.contactNumber !== undefined ? req.body.contactNumber : department.contactNumber,
  });

  if (!payload.name || !payload.description || !payload.location) {
    return res.status(400).json({
      message: 'Department name, description, and location are required',
    });
  }

  const duplicateDepartment = await Department.findOne({
    _id: { $ne: department._id },
    name: { $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });

  if (duplicateDepartment) {
    return res.status(409).json({ message: 'A department with this name already exists' });
  }

  Object.assign(department, payload);
  await department.save();

  res.status(200).json(department);
});

exports.deleteDepartment = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'department ID')) return;

  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ message: 'Department not found' });
  }

  const [linkedDoctors, linkedServices] = await Promise.all([
    Doctor.countDocuments({ departmentId: department._id, isActive: { $ne: false } }),
    Service.countDocuments({ departmentId: department._id, isActive: { $ne: false } }),
  ]);

  if (linkedDoctors > 0 || linkedServices > 0) {
    return res.status(409).json({
      message: 'Department is linked to active doctors or services and cannot be deleted',
    });
  }

  await department.deleteOne();
  return sendSuccess(res, 200, 'Department deleted successfully');
});
