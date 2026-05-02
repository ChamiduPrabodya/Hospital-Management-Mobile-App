const asyncHandler = require('../utils/asyncHandler');

const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const { createFileAsset, deleteFileAsset } = require('../utils/fileAsset');

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

  const linkedUser = doctor.userId
    ? await User.findById(doctor.userId).select('-password')
    : await User.findOne({ doctorProfileId: doctor._id, role: 'doctor' }).select('-password');

  const previousAssetIds = new Set([
    doctor.imageAssetId?.toString(),
    linkedUser?.profileImageAssetId?.toString(),
  ].filter(Boolean));

  const { asset, url: imageUrl } = await createFileAsset(req, req.file, 'doctor-image');

  doctor.image = imageUrl;
  doctor.imageAssetId = asset._id;
  await doctor.save();

  if (linkedUser) {
    linkedUser.profileImage = imageUrl;
    linkedUser.profileImageAssetId = asset._id;
    await linkedUser.save();
  }

  await Promise.all(
    Array.from(previousAssetIds)
      .filter((assetId) => assetId !== asset._id.toString())
      .map((assetId) => deleteFileAsset(assetId))
  );

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

  let doctor = null;
  if (user.role === 'doctor' && user.doctorProfileId) {
    doctor = await Doctor.findById(user.doctorProfileId);
  }

  const previousAssetIds = new Set([
    user.profileImageAssetId?.toString(),
    doctor?.imageAssetId?.toString(),
  ].filter(Boolean));

  const { asset, url: imageUrl } = await createFileAsset(req, req.file, 'profile-image');

  user.profileImage = imageUrl;
  user.profileImageAssetId = asset._id;
  await user.save();

  if (doctor) {
    doctor.image = imageUrl;
    doctor.imageAssetId = asset._id;
    await doctor.save();
  }

  await Promise.all(
    Array.from(previousAssetIds)
      .filter((assetId) => assetId !== asset._id.toString())
      .map((assetId) => deleteFileAsset(assetId))
  );

  res.status(200).json({ imageUrl, user, doctor });
});
