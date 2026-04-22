const Service = require('../models/service.model');
const Appointment = require('../models/appointment.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam } = require('../utils/validateObjectId');

exports.createService = asyncHandler(async (req, res) => {
  const { serviceName, description, price, duration, availabilityStatus } = req.body;

  if (!serviceName || !description || price === undefined || duration === undefined) {
    return res.status(400).json({ message: 'Service name, description, price and duration are required' });
  }

  const service = await Service.create({
    serviceName,
    description,
    price,
    duration,
    availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true,
  });

  res.status(201).json(service);
});

exports.getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ isActive: { $ne: false } });
  res.status(200).json(services);
});

exports.getServiceById = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'service ID')) return;

  const service = await Service.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }
  res.status(200).json(service);
});

exports.updateService = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'service ID')) return;

  const service = await Service.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const updates = {};
  if (req.body.serviceName !== undefined) updates.serviceName = req.body.serviceName;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.price !== undefined) updates.price = req.body.price;
  if (req.body.duration !== undefined) updates.duration = req.body.duration;
  if (req.body.availabilityStatus !== undefined) updates.availabilityStatus = req.body.availabilityStatus;

  Object.assign(service, updates);
  await service.save();

  res.status(200).json(service);
});

exports.deleteService = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'service ID')) return;

  const service = await Service.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const linkedAppointments = await Appointment.countDocuments({ serviceId: service._id });

  service.isActive = false;
  service.deletedAt = new Date();
  service.availabilityStatus = false;
  await service.save();

  const message = linkedAppointments > 0
    ? 'Service has linked appointments, so the service was deactivated instead of hard deleted'
    : 'Service deleted successfully';

  return sendSuccess(res, 200, message);
});
