const asyncHandler = require('../utils/asyncHandler');

const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');

const getOriginFromBaseUrl = (req) => {
  if (req?.get) {
    return `${req.protocol}://${req.get('host')}`;
  }

  const base = process.env.BASE_URL || 'http://localhost:5000/api';
  // BASE_URL is expected to end with "/api" (example: http://host:port/api)
  return base.replace(/\/api\/?$/, '');
};

exports.uploadDoctorImage = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;

  if (!doctorId) {
    return res.status(400).json({ message: 'doctorId is required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'doctorImage file is required' });
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const origin = getOriginFromBaseUrl(req);
  const imageUrl = `${origin}/uploads/doctor-images/${req.file.filename}`;

  doctor.image = imageUrl;
  await doctor.save();

  const linkedUser = doctor.userId
    ? await User.findById(doctor.userId).select('-password')
    : await User.findOne({ doctorProfileId: doctor._id, role: 'doctor' }).select('-password');

  if (linkedUser) {
    linkedUser.profileImage = imageUrl;
    await linkedUser.save();
  }

  res.status(200).json({ imageUrl, doctor, user: linkedUser });
});

exports.uploadUserProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'profileImage file is required' });
  }

  const user = await User.findById(req.user._id).select('-password');
  if (!user || user.isActive === false) {
    return res.status(404).json({ message: 'User not found' });
  }

  const origin = getOriginFromBaseUrl(req);
  const imageUrl = `${origin}/uploads/profile-images/${req.file.filename}`;

  user.profileImage = imageUrl;
  await user.save();

  let doctor = null;
  if (user.role === 'doctor' && user.doctorProfileId) {
    doctor = await Doctor.findById(user.doctorProfileId);
    if (doctor) {
      doctor.image = imageUrl;
      await doctor.save();
    }
  }

  res.status(200).json({ imageUrl, user, doctor });
});
