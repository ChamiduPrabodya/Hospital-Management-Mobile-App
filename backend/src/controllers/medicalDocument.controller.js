const Appointment = require('../models/appointment.model');
const MedicalDocument = require('../models/medicalDocument.model');
const asyncHandler = require('../utils/asyncHandler');
const { validateObjectIdParam, isValidObjectId } = require('../utils/validateObjectId');

const getOriginFromBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

const doctorCanAccessPatient = async (doctorId, patientId, appointmentId = null) => {
  const filter = { doctorId, userId: patientId };
  if (appointmentId) filter._id = appointmentId;
  return Appointment.exists(filter);
};

exports.getMedicalDocuments = asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  const filter = {};

  if (req.user.role === 'patient') {
    filter.patientId = req.user._id;
  } else if (req.user.role === 'doctor') {
    if (!req.user.doctorProfileId) {
      return res.status(400).json({ message: 'Doctor account is not linked to a doctor profile' });
    }

    if (!patientId || !isValidObjectId(patientId)) {
      return res.status(400).json({ message: 'Valid patientId is required' });
    }

    const allowed = await doctorCanAccessPatient(req.user.doctorProfileId, patientId);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    filter.patientId = patientId;
    filter.doctorId = req.user.doctorProfileId;
  } else if (req.user.role === 'admin') {
    if (patientId) {
      if (!isValidObjectId(patientId)) return res.status(400).json({ message: 'Valid patientId is required' });
      filter.patientId = patientId;
    }
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const documents = await MedicalDocument.find(filter)
    .sort({ createdAt: -1 })
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name specialization')
    .populate('appointmentId', 'appointmentDate appointmentTime status')
    .populate('uploadedBy', 'name role')
    .lean();

  res.status(200).json(documents);
});

exports.uploadMedicalDocument = asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can upload medical documents' });
  }

  if (!req.user.doctorProfileId) {
    return res.status(400).json({ message: 'Doctor account is not linked to a doctor profile' });
  }

  const { patientId, appointmentId, title, documentType, notes } = req.body;

  if (!patientId || !isValidObjectId(patientId)) {
    return res.status(400).json({ message: 'Valid patientId is required' });
  }

  if (appointmentId && !isValidObjectId(appointmentId)) {
    return res.status(400).json({ message: 'Valid appointmentId is required' });
  }

  if (!String(title || '').trim() || !String(documentType || '').trim()) {
    return res.status(400).json({ message: 'Title and document type are required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'medicalDocument file is required' });
  }

  const allowed = await doctorCanAccessPatient(req.user.doctorProfileId, patientId, appointmentId || null);
  if (!allowed) {
    return res.status(403).json({ message: 'You can upload documents only for your own patients' });
  }

  const fileUrl = `${getOriginFromBaseUrl(req)}/uploads/medical-documents/${req.file.filename}`;
  const document = await MedicalDocument.create({
    patientId,
    doctorId: req.user.doctorProfileId,
    appointmentId: appointmentId || null,
    title: String(title).trim(),
    documentType: String(documentType).trim(),
    fileUrl,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    notes: String(notes || '').trim(),
    uploadedBy: req.user._id,
  });

  const populatedDocument = await MedicalDocument.findById(document._id)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name specialization')
    .populate('appointmentId', 'appointmentDate appointmentTime status')
    .populate('uploadedBy', 'name role');

  res.status(201).json(populatedDocument);
});

exports.deleteMedicalDocument = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'document ID')) return;

  const document = await MedicalDocument.findById(req.params.id);
  if (!document) return res.status(404).json({ message: 'Medical document not found' });

  const isAdmin = req.user.role === 'admin';
  const isUploadingDoctor = req.user.role === 'doctor'
    && req.user.doctorProfileId
    && document.doctorId.toString() === req.user.doctorProfileId.toString();

  if (!isAdmin && !isUploadingDoctor) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await document.deleteOne();
  res.status(200).json({ message: 'Medical document deleted successfully' });
});
