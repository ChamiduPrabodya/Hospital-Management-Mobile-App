import React, { useCallback, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView,
  TouchableOpacity, Platform, StatusBar, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import { getDoctorByIdApi } from '../../api/doctorApi';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getProfileValidationErrors,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from '../../utils/validators';
import { formatRequestErrorMessage } from '../../utils/requestError';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const DetailRow = ({ label, value, valueStyle }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
  </View>
);

const formatLkr = (value) => (
  value !== undefined && value !== null
    ? `LKR ${Number(value).toLocaleString()}`
    : 'N/A'
);

const ProfileScreen = () => {
  const { userInfo, logout, updateProfile, updateProfileImage } = useContext(AuthContext);
  const [name,    setName]    = useState(userInfo?.name    || '');
  const [email,   setEmail]   = useState(userInfo?.email   || '');
  const [phone,   setPhone]   = useState(userInfo?.phone   || '');
  const [address, setAddress] = useState(userInfo?.address || '');
  const [errors, setErrors] = useState({});
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const isDoctor = userInfo?.role === 'doctor';
  const doctorProfileId = userInfo?.doctorProfileId?._id || userInfo?.doctorProfileId;
  const displayName = doctorProfile?.name || name;
  const profileImage = userInfo?.profileImage || doctorProfile?.userId?.profileImage || doctorProfile?.image || null;

  const initials = displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  useFocusEffect(
    useCallback(() => {
      setName(userInfo?.name || '');
      setEmail(userInfo?.email || '');
      setPhone(userInfo?.phone || '');
      setAddress(userInfo?.address || '');
    }, [userInfo?.address, userInfo?.email, userInfo?.name, userInfo?.phone])
  );

  const loadDoctorProfile = useCallback(async () => {
    if (!isDoctor || !doctorProfileId) return;

    try {
      const res = await getDoctorByIdApi(doctorProfileId);
      const profile = res.data?.data || res.data;
      if (profile?._id) setDoctorProfile(profile);
    } catch (error) {
      console.error('Failed to load doctor profile:', error.response?.data || error.message);
    }
  }, [doctorProfileId, isDoctor]);

  useFocusEffect(
    useCallback(() => {
      loadDoctorProfile();
    }, [loadDoctorProfile])
  );

  const handlePickProfileImage = async () => {
    if (isDoctor) {
      Alert.alert('Managed By Admin', 'Doctor profile photos are currently managed from the doctor administration flow.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow photo access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      const uriParts = asset.uri.split('/');
      const fallbackName = `user-${userInfo?._id || 'profile'}.jpg`;
      const name = asset.fileName || uriParts[uriParts.length - 1] || fallbackName;
      const extension = name.split('.').pop()?.toLowerCase();
      const type = asset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
      const formData = new FormData();
      formData.append('profileImage', {
        uri: asset.uri,
        name,
        type,
      });

      setLoading(true);
      await updateProfileImage(formData);
      Alert.alert('Profile Picture Updated', 'Your profile picture has been updated successfully.');
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        formatRequestErrorMessage(error, {
          timeout: 'Profile image upload timed out. Please try again.',
          network: 'Cannot reach the server right now. Please try again.',
          default: error?.response?.data?.message || error?.message || 'Unable to upload your profile picture right now.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const validationErrors = getProfileValidationErrors({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      setErrors({});
      await updateProfile({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: String(address || '').trim(),
      });
      Alert.alert('Profile Updated', 'Your information has been saved successfully.');
    } catch (error) {
      Alert.alert(
        'Update Failed',
        formatRequestErrorMessage(error, {
          timeout: 'Profile update timed out. Please try again.',
          network: 'Cannot reach the server right now. Please try again.',
          default: 'Please try again.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Saving profile..." />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      <View style={styles.hero}>
        <View style={styles.circle1} /><View style={styles.circle2} />
        <Text style={styles.heroEst}>VICTORIA HOSPITAL</Text>
        <Text style={styles.heroTitle}>My Profile</Text>
        <View style={styles.accentBar} />
        <View style={styles.avatarWrap}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {!isDoctor ? (
            <TouchableOpacity style={styles.photoButton} onPress={handlePickProfileImage} activeOpacity={0.8}>
              <Text style={styles.photoButtonText}>{profileImage ? 'Change Photo' : 'Add Photo'}</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userInfo?.role || 'Patient'}</Text>
          </View>
        </View>
        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroEmail}>{email}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isDoctor ? (
          <>
            <Text style={styles.sectionLabel}>PROFESSIONAL PROFILE</Text>
            <View style={styles.detailCard}>
              {doctorProfile ? (
                <>
                  <DetailRow label="Doctor Name" value={doctorProfile.name || 'N/A'} />
                  <View style={styles.divider} />
                  <DetailRow label="Specialization" value={doctorProfile.specialization || 'N/A'} />
                  <View style={styles.divider} />
                  <DetailRow label="Experience" value={`${doctorProfile.experience ?? 'N/A'} yrs`} />
                  <View style={styles.divider} />
                  <DetailRow label="Consultation Fee" value={formatLkr(doctorProfile.consultationFee)} />
                  <View style={styles.divider} />
                  <DetailRow
                    label="Availability"
                    value={doctorProfile.availabilityStatus ? 'Available' : 'Not Available'}
                    valueStyle={{ color: doctorProfile.availabilityStatus ? COLORS.success : COLORS.danger }}
                  />
                  <View style={styles.divider} />
                  <Text style={styles.bioLabel}>Bio</Text>
                  <Text style={styles.bioText}>
                    {doctorProfile.description || 'No bio has been added by admin yet.'}
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  Doctor profile details are not available yet. Please ask admin to link this account to a doctor profile.
                </Text>
              )}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>ACCOUNT INFORMATION</Text>

        <View style={styles.formCard}>
          <CustomInput label="Full Name"     value={name}    onChangeText={setName}    placeholder="Your name"    autoCapitalize="words" errorMessage={errors.name} />
          <CustomInput label="Email Address" value={email}   onChangeText={setEmail}   placeholder="Your email"   keyboardType="email-address" errorMessage={errors.email} />
          <CustomInput label="Phone Number"  value={phone}   onChangeText={setPhone}   placeholder="Your phone"   keyboardType="phone-pad" errorMessage={errors.phone} />
          <CustomInput label="Address"       value={address} onChangeText={setAddress} placeholder="Your address" />
        </View>

        <CustomButton title="Save Changes" onPress={handleUpdate} style={styles.saveBtn} />

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  hero: {
    backgroundColor: COLORS.navyMid,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -60 },
  circle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30 },
  heroEst:    { fontSize: 9, letterSpacing: 2.2, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  heroTitle:  { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.white, marginBottom: 10 },
  accentBar:  { width: 36, height: 3, backgroundColor: COLORS.tealLight, borderRadius: 2, marginBottom: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.tealBright,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.bgMuted,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.white },
  photoButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  photoButtonText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: FONTS.semibold,
    letterSpacing: 0.3,
  },
  roleBadge: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  roleText:   { fontSize: 11, color: COLORS.white, fontWeight: FONTS.semibold, letterSpacing: 1, textTransform: 'uppercase' },
  heroName:   { fontSize: 18, fontWeight: FONTS.bold,    color: COLORS.white, marginTop: 8 },
  heroEmail:  { fontSize: 13, fontWeight: FONTS.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel:  { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },

  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  detailCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
    textTransform: 'uppercase',
  },
  detailValue: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
    textAlign: 'right',
  },
  detailValueLeft: {
    textAlign: 'left',
  },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 11 },
  bioLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  saveBtn:    { marginBottom: 10 },
  logoutBtn: {
    paddingVertical: 14, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.danger, alignItems: 'center', marginTop: 6,
  },
  logoutText: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.danger },
});

export default ProfileScreen;
